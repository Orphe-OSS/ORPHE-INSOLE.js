#!/usr/bin/env python3
"""
SCRIPT.md から2声のポッドキャスト音声を生成する。

NotebookLM と違い、**台本のセリフをそのまま読ませる**ので数字も言い回しも忠実。
「ホスト」と「解説」に別の声を割り当てて対話として合成し、1本のMP3に連結する。

■ 推奨（高品質・自然な日本語ニューラル音声）
    pip install edge-tts
    python3 render_podcast.py --backend edge --chapters 0,1 --out ep1.mp3
  ホスト=ja-JP-KeitaNeural（男性）、解説=ja-JP-NanamiNeural（女性）で対話になる。
  無料。全6章を通すと約81分。ffmpeg があれば無音を挟んだ MP3、無ければ MP3 の
  単純連結（間合いはやや詰まる）。

■ オフライン（品質は機械的。ネットが使えない環境・パイプライン確認用）
    apt-get install espeak-ng && pip install pykakasi
    python3 render_podcast.py --backend espeak --chapters 0 --out demo.wav
  espeak-ng の日本語は漢字を正しく読めないため、pykakasi で漢字→かなに開いてから
  渡す（未導入だと読み上げが約2.7倍遅くなり不自然）。出力は WAV。

■ 抑揚をもっと自然にしたい場合（有料・要 APIキー）
    export OPENAI_API_KEY="sk-..."
    python3 render_podcast.py --backend openai --chapters 0 --out test_openai.mp3
  gpt-4o-mini-tts は instructions で「落ち着いた解説者として」「相槌を打つように」
  といった演技指示ができるため、edge より抑揚が付く。全台本(約26,700字)でも数円程度。

声を変えたい場合:
    python3 render_podcast.py --list-voices          # 使える日本語ボイスを一覧
    python3 render_podcast.py --voice-host ja-JP-DaichiNeural --voice-guest ja-JP-AoiNeural ...

主なオプション:
    --chapters 0,1     章を指定（未指定なら全章）
    --limit N          先頭N ターンだけ（試聴用）
    --rate  "+10%"     話速（edge。話者別の既定を上書き）
    --pitch "+10Hz"    声の高さ（edge）
    --voice-host / --voice-guest   話者ごとの声を指定
    --gap / --chapter-gap   セリフ間 / 章間の無音 [ms]
    --no-kana          espeak でかな変換をしない
    --list-voices      利用可能な日本語ボイスを表示（edge のみ）

抑揚が平坦に感じるときの対処（効果が大きい順）:
    1. --backend openai に変える（instructions で演技指示が効く）
    2. --list-voices で別の日本語ボイスを試す（世代が新しい声ほど表現力が高い）
    3. PROSODY_EDGE の rate / pitch を話者ごとに調整する
    4. ffmpeg を入れて --gap を 400〜500ms にし、間を作る

外部コマンド:
    ffmpeg  … 任意。あれば無音を正確に挟んで MP3 化する。無くても動作する
              （espeak→WAV は標準ライブラリで正確に連結、edge→MP3 はバイト連結）。
              ※ Playwright 同梱の ffmpeg は録画専用ビルドで音声処理に使えないため、
                機能を実測して判定し、使えない場合は自動でフォールバックする。
"""
import argparse
import asyncio
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_SCRIPT = os.path.join(HERE, "SCRIPT.md")

# 話者 → 声。edge-tts の日本語ニューラルボイス。
# --voice-host / --voice-guest で上書きできる。使える声は --list-voices で確認。
VOICES_EDGE = {
    "ホスト": "ja-JP-KeitaNeural",    # 男性・聞き手
    "解説": "ja-JP-NanamiNeural",     # 女性・解説役
}

# 話者ごとのプロソディ（抑揚づけ）。edge-tts の既定は平坦になりがちなので、
# 聞き手はやや速く高め（相槌らしく）、解説役はやや遅く低め（説明らしく）にして
# 対話のコントラストを出す。--rate / --pitch で全体を追加調整できる。
PROSODY_EDGE = {
    "ホスト": {"rate": "+8%", "pitch": "+8Hz"},
    "解説": {"rate": "+2%", "pitch": "-2Hz"},
}

# OpenAI TTS のボイス割り当てと、声の演技指示（instructions）。
# gpt-4o-mini-tts は instructions でトーンを指定できるのが強み。
VOICES_OPENAI = {
    "ホスト": "ash",
    "解説": "sage",
}
INSTRUCTIONS_OPENAI = {
    "ホスト": "日本語のポッドキャストの聞き手。好奇心を持って相槌を打つように、"
              "自然な抑揚で、やや軽快に話す。驚いたところは声を上げる。",
    "解説": "日本語のポッドキャストの解説者。落ち着いた専門家として、"
            "噛み砕いて丁寧に説明する。重要な数字はゆっくり強調して読む。",
}
# espeak-ng は1声しかないのでピッチで区別する
VOICES_ESPEAK = {
    "ホスト": ["-p", "35"],
    "解説": ["-p", "60"],
}

# 読み上げ用の表記ゆらぎ補正（記号や単位を読める形に）
NORMALIZE = [
    (r"m/s²", "メートル毎秒毎秒"),
    (r"m/s", "メートル毎秒"),
    (r"(\d)\s*cm\b", r"\1センチ"),
    (r"(\d)\s*mm\b", r"\1ミリ"),
    (r"(\d)\s*m\b", r"\1メートル"),
    (r"(\d)\s*km\b", r"\1キロメートル"),
    (r"(\d)\s*kg\b", r"\1キログラム"),
    (r"(\d)\s*%", r"\1パーセント"),
    (r"(\d)\s*Hz\b", r"\1ヘルツ"),
    (r"(\d)\s*fps\b", r"\1フレーム毎秒"),
    (r"(\d)\s*spm\b", r"\1ステップ毎分"),
    (r"\bICC\b", "アイシーシー"),
    (r"\bIMU\b", "アイエムユー"),
    (r"\bSMPL\b", "エスエムピーエル"),
    (r"\bGIP\b", "ジーアイピー"),
    (r"\bGRIP\b", "グリップ"),
    (r"\bZUPT\b", "ザプト"),
    (r"\bVAE\b", "ブイエーイー"),
    (r"\bCoP\b", "シーオーピー"),
    (r"\bFK\b", "順運動学"),
    (r"\bIK\b", "逆運動学"),
    (r"\bBLE\b", "ビーエルイー"),
    (r"\bfps\b", "フレーム毎秒"),
    (r"→", "から"),
    (r"[〜~]", "から"),
    (r"×", "かける"),
]


def clean_text(s: str) -> str:
    """マークダウン記法と制作用マークを除去し、読み上げ可能な平文にする。"""
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)      # 太字
    s = re.sub(r"`(.+?)`", r"\1", s)            # コード
    s = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", s)   # リンク
    s = s.replace("🔵", "").replace("⚠️", "").replace("⭐", "")
    s = re.sub(r"\s+", " ", s).strip()
    for pat, rep in NORMALIZE:
        s = re.sub(pat, rep, s)
    return s


def parse_script(path: str, chapters=None):
    """SCRIPT.md を (章番号, 話者, セリフ) のリストにする。"""
    turns = []
    cur_ch = None
    for line in open(path, encoding="utf-8"):
        line = line.rstrip("\n")
        m = re.match(r"^## 第(\d+)章", line)
        if m:
            cur_ch = int(m.group(1))
            continue
        m = re.match(r"^\*\*(ホスト|解説):\*\*\s*(.+)$", line)
        if not m:
            continue
        if cur_ch is None:
            continue
        if chapters is not None and cur_ch not in chapters:
            continue
        text = clean_text(m.group(2))
        if text:
            turns.append((cur_ch, m.group(1), text))
    return turns


def find_ffmpeg():
    """本物の ffmpeg があれば返す。無ければ None（純Python経路にフォールバック）。

    Playwright 同梱の ffmpeg は録画専用の機能限定ビルドで lavfi も mp3 も持たないため、
    実際に無音生成が通るかを試して判定する。
    """
    cand = shutil.which("ffmpeg")
    if not cand:
        return None
    try:
        subprocess.run([cand, "-hide_banner", "-f", "lavfi", "-i",
                        "anullsrc=r=24000:cl=mono", "-t", "0.1", "-f", "null", "-"],
                       check=True, capture_output=True, timeout=30)
        return cand
    except Exception:
        return None


async def synth_edge(turns, workdir, rate="", pitch="", voices=None):
    """edge-tts で合成。話者ごとのプロソディを当てて平坦さを軽減する。"""
    import edge_tts
    voices = voices or VOICES_EDGE
    files = []
    for i, (_ch, spk, text) in enumerate(turns):
        out = os.path.join(workdir, f"{i:05d}.mp3")
        p = dict(PROSODY_EDGE.get(spk, {}))
        if rate:
            p["rate"] = rate      # 明示指定があれば話者ごとの既定を上書き
        if pitch:
            p["pitch"] = pitch
        await edge_tts.Communicate(text, voices[spk], **p).save(out)
        files.append(out)
        if (i + 1) % 20 == 0:
            print(f"  {i+1}/{len(turns)} 合成済み", flush=True)
    return files


def synth_openai(turns, workdir, model="gpt-4o-mini-tts", voices=None):
    """OpenAI TTS で合成。instructions で話し方を指示できるぶん表現力が高い。

    環境変数 OPENAI_API_KEY が必要。料金は gpt-4o-mini-tts で概ね $0.60/100万文字
    なので、本台本（約26,700字）を全部読ませても数円程度。
    """
    import json
    import urllib.request
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        sys.exit("OPENAI_API_KEY が設定されていません。\n"
                 '  export OPENAI_API_KEY="sk-..." を実行してから再試行してください。')
    voices = voices or VOICES_OPENAI
    files = []
    for i, (_ch, spk, text) in enumerate(turns):
        out = os.path.join(workdir, f"{i:05d}.mp3")
        body = json.dumps({
            "model": model,
            "voice": voices[spk],
            "input": text,
            "instructions": INSTRUCTIONS_OPENAI.get(spk, ""),
            "response_format": "mp3",
        }).encode()
        req = urllib.request.Request(
            "https://api.openai.com/v1/audio/speech", data=body,
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r, open(out, "wb") as f:
            f.write(r.read())
        files.append(out)
        if (i + 1) % 20 == 0:
            print(f"  {i+1}/{len(turns)} 合成済み", flush=True)
    return files


def make_kana_converter():
    """漢字→ひらがな変換器を返す（無ければ None）。

    espeak-ng の日本語は漢字を正しく読めず、実測で 0.53 秒/文字（正常は 0.19）まで
    落ちる。かなに開いてから渡すと正常な速度・読みになるため、espeak では必須。
    ただし辞書ベースなので固有名詞や同訓異字の誤読は残る（例: 「下」→「くだ」）。
    edge-tts は漢字をそのまま正しく読めるので変換しない。
    """
    try:
        import pykakasi
    except Exception:
        return None
    kks = pykakasi.kakasi()
    return lambda s: "".join(it["hira"] for it in kks.convert(s))


def synth_espeak(turns, workdir, use_kana=True):
    kana = make_kana_converter() if use_kana else None
    if use_kana and kana is None:
        print("  注意: pykakasi が無いため漢字のまま読み上げます（不自然に遅くなります）。"
              "\n        pip install pykakasi を推奨。")
    files = []
    for i, (_ch, spk, text) in enumerate(turns):
        out = os.path.join(workdir, f"{i:05d}.wav")
        say = kana(text) if kana else text
        cmd = ["espeak-ng", "-v", "ja", "-s", "150", *VOICES_ESPEAK[spk], "-w", out, say]
        subprocess.run(cmd, check=True, capture_output=True)
        files.append(out)
        if (i + 1) % 20 == 0:
            print(f"  {i+1}/{len(turns)} 合成済み", flush=True)
    return files


def concat_ffmpeg(files, turns, out_path, ffmpeg, gap_ms, chapter_gap_ms):
    """ffmpeg があるときの本筋。無音を挟んで MP3 に書き出す。"""
    wd = os.path.dirname(files[0])
    listfile = os.path.join(wd, "concat.txt")
    silence = os.path.join(wd, "sil.mp3")
    long_sil = os.path.join(wd, "sil_long.mp3")
    for path, ms in ((silence, gap_ms), (long_sil, chapter_gap_ms)):
        subprocess.run([ffmpeg, "-y", "-f", "lavfi", "-i",
                        "anullsrc=channel_layout=mono:sample_rate=24000",
                        "-t", str(ms / 1000), "-q:a", "9", path],
                       check=True, capture_output=True)
    with open(listfile, "w", encoding="utf-8") as f:
        prev_ch = turns[0][0]
        for path, (ch, _spk, _t) in zip(files, turns):
            if ch != prev_ch:
                f.write(f"file '{long_sil}'\n")
                prev_ch = ch
            f.write(f"file '{path}'\n")
            f.write(f"file '{silence}'\n")
    subprocess.run([ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", listfile,
                    "-c:a", "libmp3lame", "-b:a", "96k", out_path],
                   check=True, capture_output=True)


def concat_wav(files, turns, out_path, gap_ms, chapter_gap_ms):
    """ffmpeg 不要。標準ライブラリ wave で WAV を正確に連結し、無音も自前で挟む。"""
    import wave
    with wave.open(files[0], "rb") as w0:
        params = w0.getparams()
    frame_bytes = params.sampwidth * params.nchannels
    sil = b"\x00" * int(params.framerate * gap_ms / 1000) * frame_bytes
    sil_long = b"\x00" * int(params.framerate * chapter_gap_ms / 1000) * frame_bytes
    with wave.open(out_path, "wb") as out:
        out.setparams(params)
        prev_ch = turns[0][0]
        for path, (ch, _spk, _t) in zip(files, turns):
            if ch != prev_ch:
                out.writeframes(sil_long)
                prev_ch = ch
            with wave.open(path, "rb") as w:
                out.writeframes(w.readframes(w.getnframes()))
            out.writeframes(sil)


def concat_mp3_bytes(files, out_path):
    """ffmpeg 不要の MP3 フォールバック。同一パラメータの MP3 は連結して再生できる。
    無音を挟めないため間合いはやや詰まる（正確な間合いが必要なら ffmpeg を入れる）。"""
    with open(out_path, "wb") as out:
        for path in files:
            with open(path, "rb") as f:
                out.write(f.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--script", default=DEFAULT_SCRIPT)
    ap.add_argument("--backend", choices=["edge", "openai", "espeak"], default="edge")
    ap.add_argument("--out", default="podcast.mp3")
    ap.add_argument("--chapters", help="例: 0,1  (未指定なら全章)")
    ap.add_argument("--limit", type=int, help="先頭N ターンのみ（試聴用）")
    ap.add_argument("--rate", default="", help='話速。例 "+10%%"（edge。話者別の既定を上書き）')
    ap.add_argument("--pitch", default="", help='声の高さ。例 "+10Hz"（edge）')
    ap.add_argument("--voice-host", default="", help="ホスト役の声を指定")
    ap.add_argument("--voice-guest", default="", help="解説役の声を指定")
    ap.add_argument("--openai-model", default="gpt-4o-mini-tts", help="OpenAI TTS のモデル")
    ap.add_argument("--gap", type=int, default=350, help="セリフ間の無音 [ms]")
    ap.add_argument("--chapter-gap", type=int, default=900, help="章の切れ目の無音 [ms]")
    ap.add_argument("--no-kana", action="store_true",
                    help="espeak で漢字→かな変換をしない（既定は変換する）")
    ap.add_argument("--list-voices", action="store_true")
    args = ap.parse_args()

    if args.list_voices:
        import edge_tts
        vs = asyncio.run(edge_tts.list_voices())
        for v in sorted(x["ShortName"] for x in vs if x["Locale"].startswith("ja")):
            print(" ", v)
        return

    chapters = None
    if args.chapters:
        chapters = {int(x) for x in args.chapters.split(",") if x.strip() != ""}
    turns = parse_script(args.script, chapters)
    if args.limit:
        turns = turns[: args.limit]
    if not turns:
        sys.exit("読み上げ対象のセリフが見つかりません。--chapters の指定を確認してください。")

    chars = sum(len(t[2]) for t in turns)
    print(f"ターン数 {len(turns)} / 文字数 {chars} / 推定尺 約{chars/330:.0f}分 "
          f"(章: {sorted({t[0] for t in turns})})")

    ffmpeg = find_ffmpeg()
    out = args.out
    with tempfile.TemporaryDirectory() as wd:
        print(f"合成中（backend={args.backend}）...")
        if args.backend == "edge":
            voices = dict(VOICES_EDGE)
            if args.voice_host:
                voices["ホスト"] = args.voice_host
            if args.voice_guest:
                voices["解説"] = args.voice_guest
            files = asyncio.run(synth_edge(turns, wd, args.rate, args.pitch, voices))
        elif args.backend == "openai":
            voices = dict(VOICES_OPENAI)
            if args.voice_host:
                voices["ホスト"] = args.voice_host
            if args.voice_guest:
                voices["解説"] = args.voice_guest
            files = synth_openai(turns, wd, args.openai_model, voices)
        else:
            files = synth_espeak(turns, wd, use_kana=not args.no_kana)

        print("連結中..." + ("" if ffmpeg else "（ffmpeg なし → 標準ライブラリで処理）"))
        if ffmpeg:
            concat_ffmpeg(files, turns, out, ffmpeg, args.gap, args.chapter_gap)
        elif args.backend == "espeak":
            if not out.lower().endswith(".wav"):
                out = os.path.splitext(out)[0] + ".wav"
                print(f"  ffmpeg が無いので WAV で出力します: {out}")
            concat_wav(files, turns, out, args.gap, args.chapter_gap)
        else:
            print("  注意: ffmpeg が無いため無音の挿入ができません（間合いがやや詰まります）。"
                  "\n        正確な間合いが必要なら ffmpeg をインストールしてください。")
            concat_mp3_bytes(files, out)
    size = os.path.getsize(out)
    print(f"完成: {out} ({size/1024/1024:.1f} MB)")


if __name__ == "__main__":
    main()
