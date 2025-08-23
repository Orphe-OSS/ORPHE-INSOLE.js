var di_data_textarea_buffer = [];
var di_data_buffer = [];
var dt_data_textarea_buffer = [];
var dt_data_buffer = [];

var ar_data_textarea_buffer = [];
var ar_data_buffer = [];
var is_connected = false;
var is_playing = false;
var number_of_lost_data = 0;
function formatNumber(number) {
    return number.toString().padStart(4, '0');
}

var insole = new Orphe(0);
window.onload = function () {

    insole.setup();
    insole.onConnect = function () {
        console.log('onConnect callback triggered');
        const wasConnected = is_connected; // 既に接続されていたかを記録
        is_connected = true;
        
        // 初回接続時のみis_playingをtrueにする
        if (!wasConnected) {
            is_playing = true;
            console.log('First connection - setting is_playing to true');
        } else {
            console.log('Reconnection - preserving is_playing state:', is_playing);
        }

        // Update UI
        const connectButton = document.querySelector('#connectButton');
        const connectionStatus = document.querySelector('#connectionStatus');
        if (connectButton && connectionStatus) {
            connectButton.textContent = 'Disconnect';
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'connected';
        }
    }
    insole.onDisconnect = function () {
        console.log('onDisconnect callback triggered');
        is_connected = false;
        is_playing = false;
        // Update UI
        const connectButton = document.querySelector('#connectButton');
        const connectionStatus = document.querySelector('#connectionStatus');
        if (connectButton && connectionStatus) {
            connectButton.textContent = 'Connect Device';
            connectionStatus.textContent = 'Not Connected';
            connectionStatus.className = 'disconnected';
        }
        alert('ORPHE COREとの接続が切れました');
    }
    insole.lostData = function (num, num_prev) {
        let str = document.querySelector('#textarea_lost_data').innerHTML;
        str += `[${formatNumber(number_of_lost_data)}]: ${num_prev} <-> ${num}\n`;
        number_of_lost_data++;
        document.querySelector('#textarea_lost_data').innerHTML = str;
    }
    insole.gotData = function (data, uuid) {

        if (uuid == 'DEVICE_INFORMATION') {
            document.querySelector('#di_textarea_recv').innerHTML = '';
            for (let i = 0; i < data.byteLength; i++) {
                di_data_textarea_buffer.push(data.getUint8(i).toString(16).toUpperCase());
                di_data_buffer.push(data.getUint8(i).toString(16).toUpperCase());
            }
            di_data_textarea_buffer.push('\n');
            di_data_buffer.push('\n');
            while (di_data_textarea_buffer.length > 1024) { // 1KB
                di_data_textarea_buffer.shift();
            }
            while (di_data_buffer.length > 1024 * 1000 * 10) { //10MB
                di_data_buffer.shift();
            }
            let str = '';
            for (d of di_data_textarea_buffer) {
                if (d != '\n') {
                    str += `${d},`
                }
                else {
                    str += `${d}`
                }
            }
            document.querySelector('#di_textarea_recv').innerHTML = str;
            document.querySelector("#di_textarea_recv").scrollTop = document.querySelector("#di_textarea_recv").scrollHeight;

            document.querySelector('#di_textarea_buffer_size').innerHTML = di_data_textarea_buffer.length;
            document.querySelector('#di_buffer_size').innerHTML = di_data_buffer.length;
        }
        else if (uuid == 'DATE_TIME') {
            document.querySelector('#dt_textarea_recv').innerHTML = '';
            for (let i = 0; i < data.byteLength; i++) {
                dt_data_textarea_buffer.push(data.getUint8(i).toString(16).toUpperCase());
                dt_data_buffer.push(data.getUint8(i).toString(16).toUpperCase());
            }
            di_data_textarea_buffer.push('\n');
            di_data_buffer.push('\n');
            while (di_data_textarea_buffer.length > 1024) { // 1KB
                di_data_textarea_buffer.shift();
            }
            while (di_data_buffer.length > 1024 * 1000 * 10) { //10MB
                di_data_buffer.shift();
            }
            let str = '';
            for (let d of dt_data_textarea_buffer) {
                if (d !== '\n') {
                    str += `${d.toString().padStart(2, '0')},`;
                } else {
                    str += `${d}`;
                }
            }
            document.querySelector('#dt_textarea_recv').innerHTML = str;
            document.querySelector("#dt_textarea_recv").scrollTop = document.querySelector("#dt_textarea_recv").scrollHeight;
            document.querySelector('#dt_textarea_buffer_size').innerHTML = di_data_textarea_buffer.length;
            document.querySelector('#dt_buffer_size').innerHTML = di_data_buffer.length;
        }
        else {
            if (is_playing) {
                document.querySelector('#ar_textarea_recv').innerHTML = '';
                for (let i = 0; i < data.byteLength; i++) {
                    ar_data_textarea_buffer.push(data.getUint8(i).toString(16).toUpperCase());
                    ar_data_buffer.push(data.getUint8(i).toString(16).toUpperCase());
                }
                ar_data_textarea_buffer.push('\n');
                ar_data_buffer.push('\n');
                while (ar_data_textarea_buffer.length > 1024) {
                    ar_data_textarea_buffer.shift();
                }
                while (ar_data_buffer.length > 1024 * 1000 * 10) { // 10MB
                    ar_data_buffer.shift();
                }

                let str = '';
                for (d of ar_data_textarea_buffer) {
                    if (d != '\n') {
                        str += `${d},`
                    }
                    else {
                        str += `${d}`
                    }
                }

                document.querySelector('#ar_textarea_recv').innerHTML = str;
                document.querySelector("#ar_textarea_recv").scrollTop = document.querySelector("#ar_textarea_recv").scrollHeight;
                document.querySelector("#textarea_lost_data").scrollTop = document.querySelector("#textarea_lost_data").scrollHeight;
                document.querySelector('#ar_textarea_buffer_size').innerHTML = ar_data_textarea_buffer.length;
                document.querySelector('#ar_buffer_size').innerHTML = ar_data_buffer.length;
            }
        }
    }

    document.querySelector('#send_message').addEventListener('keydown', function (e) {
        if (e.key == 'Enter') {
            send();
        }
    });


    // device informationのバッファやdom無いテキストのクリア
    document.querySelector('#button_di_clear').addEventListener('click', function () {
        di_data_buffer = [];
        di_data_textarea_buffer = [];
        document.querySelector('#di_textarea_recv').innerHTML = '';
        document.querySelector('#di_textarea_buffer_size').innerHTML = di_data_textarea_buffer.length;
        document.querySelector('#di_buffer_size').innerHTML = di_data_buffer.length;
    })

    // device informationのバッファやdom無いテキストのクリア
    document.querySelector('#button_dt_clear').addEventListener('click', function () {
        dt_data_buffer = [];
        dt_data_textarea_buffer = [];
        document.querySelector('#dt_textarea_recv').innerHTML = '';
        document.querySelector('#dt_textarea_buffer_size').innerHTML = dt_data_textarea_buffer.length;
        document.querySelector('#dt_buffer_size').innerHTML = dt_data_buffer.length;
    })

    // analysis/raw notify のバッファやdom内テキストのクリア
    document.querySelector('#button_ar_clear').addEventListener('click', function () {
        ar_data_buffer = [];
        ar_data_textarea_buffer = [];
        document.querySelector('#ar_textarea_recv').innerHTML = '';
        document.querySelector('#ar_textarea_buffer_size').innerHTML = ar_data_textarea_buffer.length;
        document.querySelector('#ar_buffer_size').innerHTML = ar_data_buffer.length;
    })

    // analysis/raw notify のlostDataバッファやdom内テキストのクリア
    document.querySelector('#button_lost_data_clear').addEventListener('click', function () {
        document.querySelector('#textarea_lost_data').innerHTML = '';
        number_of_lost_data = 0;
    })

    // device informationのバッファをCSV形式でダウンロード
    document.querySelector('#button_di_download').addEventListener('click', function () {
        let str = '';
        for (d of di_data_buffer) {
            if (d != '\n') {
                str += `${d},`
            }
            else {
                str += `${d}`
            }
        }
        let blob = new Blob([str], { "type": "text/csv" });
        let a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', `device_information.csv`);
        a.click();
    });

    // date timeのバッファをCSV形式でダウンロード
    document.querySelector('#button_dt_download').addEventListener('click', function () {
        let str = '';
        for (d of dt_data_buffer) {
            if (d != '\n') {
                str += `${d},`
            }
            else {
                str += `${d}`
            }
        }
        let blob = new Blob([str], { "type": "text/csv" });
        let a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', `date_time.csv`);
        a.click();
    });

    // analysis / raw notifyのバッファをCSV形式でダウンロード
    document.querySelector('#button_ar_download').addEventListener('click', function () {
        let str = '';
        for (d of ar_data_buffer) {
            if (d != '\n') {
                str += `${d},`
            }
            else {
                str += `${d}`
            }
        }
        let blob = new Blob([str], { "type": "text/csv" });
        let a = document.createElement('a');
        a.href = window.URL.createObjectURL(blob);
        a.setAttribute('download', `analysis_raw_notify.csv`);
        a.click();
    });

    document.querySelector('#button_ar_pause').addEventListener('click', function () {
        is_playing = !is_playing;
        if (is_playing) {
            this.innerHTML = 'pause';
        }
        else {
            this.innerHTML = 'play';
        }
    });
}

function send(dom, characteristic = 'DEVICE_INFORMATION') {
    if (is_connected == false) {
        alert('ORPHE COREに接続してください');
        return;
    }
    let commands = []
    if (characteristic == 'DEVICE_INFORMATION') {
        let message = document.querySelector('#send_message').value;
        let list = message.split(',');

        for (let l of list) {
            commands.push(parseInt(l, 16));
        }
        console.log(commands);
    }
    else if (characteristic == 'DATE_TIME') {
        let message = document.querySelector('#send_date_time_message').value;
        let list = message.split(',');
        for (let l of list) {
            commands.push(parseInt(l, 16));
        }
        console.log("date time:", commands);
    }
    else {
        alert('characteristicが不正です');
        return;
    }

    let senddata = new Uint8Array(commands);
    insole.write(characteristic, senddata);
}

async function read(dom, characteristic = 'DEVICE_INFORMATION') {
    console.log('read() called with characteristic:', characteristic, 'current is_playing:', is_playing);
    
    if (is_connected == false) {
        alert('ORPHE COREに接続してください');
        return;
    }

    if (characteristic == 'DEVICE_INFORMATION') {
        console.log('Calling insole.getDeviceInformation()');
        let ret = await insole.getDeviceInformation();
        console.log('getDeviceInformation completed, is_playing after call:', is_playing);
        let resultArray = [];
        for (let i = 0; i < ret.raw.byteLength; i++) {
            resultArray.push(ret.raw.getUint8(i).toString(16).padStart(2, '0').toUpperCase());
        }
        document.querySelector('#di_textarea_recv').innerHTML += resultArray.join(',');
        document.querySelector('#di_textarea_recv').innerHTML += '\n';
        document.querySelector("#di_textarea_recv").scrollTop = document.querySelector("#di_textarea_recv").scrollHeight;

    }
    else if (characteristic == 'DATE_TIME') {
        console.log('Calling insole.getDateTime()');
        let ret = await insole.getDateTime();
        console.log('getDateTime completed, is_playing after call:', is_playing);
        let resultArray = [];
        for (let i = 0; i < ret.raw.byteLength; i++) {
            resultArray.push(ret.raw.getUint8(i).toString(16).padStart(2, '0').toUpperCase());
        }
        document.querySelector('#dt_textarea_recv').innerHTML += resultArray.join(',');
        document.querySelector('#dt_textarea_recv').innerHTML += '\n';
        document.querySelector("#dt_textarea_recv").scrollTop = document.querySelector("#dt_textarea_recv").scrollHeight;
    }

    console.log('read() completed, final is_playing:', is_playing);
}

// Connect Device function
async function connectDevice() {
    const connectButton = document.querySelector('#connectButton');
    const connectionStatus = document.querySelector('#connectionStatus');

    console.log('connectDevice called, current is_connected:', is_connected);

    if (is_connected) {
        // Disconnect
        console.log('Attempting to disconnect...');
        try {
            connectButton.textContent = 'Disconnecting...';
            connectionStatus.textContent = 'Disconnecting...';
            connectionStatus.className = '';

            await insole.reset();
            console.log('insole.reset() completed');

            // reset()がonDisconnectを呼び出さない場合に備えて手動で更新
            if (is_connected) {
                console.log('Manually updating disconnect state');
                is_connected = false;
                is_playing = false;
                connectButton.textContent = 'Connect Device';
                connectionStatus.textContent = 'Not Connected';
                connectionStatus.className = 'disconnected';
            }
        } catch (error) {
            console.error('Disconnect error:', error);
            // エラー時も切断状態にする
            is_connected = false;
            is_playing = false;
            connectButton.textContent = 'Connect Device';
            connectionStatus.textContent = 'Disconnected (Error)';
            connectionStatus.className = 'disconnected';
        }
    } else {
        // Connect
        console.log('Attempting to connect...');
        try {
            connectButton.textContent = 'Connecting...';
            connectionStatus.textContent = 'Connecting...';
            connectionStatus.className = '';

            await insole.begin();
            console.log('insole.begin() completed');

            // begin()がonConnectを呼び出さない場合に備えて手動で更新
            if (!is_connected) {
                console.log('Manually updating connect state');
                is_connected = true;
                is_playing = true; // 手動接続時のみtrueに設定
                connectButton.textContent = 'Disconnect';
                connectionStatus.textContent = 'Connected';
                connectionStatus.className = 'connected';
            }
        } catch (error) {
            console.error('Connection error:', error);
            connectButton.textContent = 'Connect Device';
            connectionStatus.textContent = 'Connection Failed';
            connectionStatus.className = 'disconnected';
            is_connected = false;
            is_playing = false;
        }
    }

    console.log('connectDevice completed, final is_connected:', is_connected);
}
