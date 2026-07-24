const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: [
            'dist/',
            'docs/',
            'node_modules/',
            'examples/p5.ORPHE.FSR_visualise_0327_submit/',
            'examples/UDON_fsr_20250724/'
        ]
    },
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                ...globals.node,
                Quaternion: 'readonly',
                Chart: 'readonly',
                p5: 'readonly',
                bootstrap: 'readonly',
                OrpheInsole: 'writable',
                OrpheInsoleSimulator: 'readonly',
                OrpheInsoleFifo: 'readonly',
                OrpheInsoleGait: 'readonly',
                OrpheInsoleUtils: 'readonly',
                Orphe: 'writable',
                insoles: 'writable',
                bles: 'writable',
                cores: 'writable',
                buildInsoleToolkit: 'readonly',
                buildCoreToolkit: 'readonly',
                getInsoleToolkitSession: 'readonly',
                insoleToolkitSessions: 'readonly',
                orphe_js_version_date: 'readonly',
                updateFSRData: 'writable',
                PRESSURE_SENSOR_LAYOUT: 'readonly',
                ChartFeed: 'readonly',
                makeLineChart: 'readonly',
                AttitudeViz: 'readonly',
                DemoData: 'readonly',
                createPressurePanel: 'readonly',
                createImuPanel: 'readonly',
                createCanvas: 'readonly',
                textAlign: 'readonly',
                CENTER: 'readonly',
                loadImage: 'readonly',
                background: 'readonly',
                image: 'readonly',
                width: 'readonly',
                height: 'readonly',
                fill: 'readonly',
                noStroke: 'readonly',
                map: 'readonly',
                constrain: 'readonly',
                ellipse: 'readonly',
                LEFT: 'readonly',
                TOP: 'readonly',
                textSize: 'readonly',
                text: 'readonly',
                key: 'readonly',
                rect: 'readonly',
                loadModel: 'readonly',
                WEBGL: 'readonly',
                camera: 'readonly',
                push: 'readonly',
                translate: 'readonly',
                directionalLight: 'readonly',
                ambientLight: 'readonly',
                ambientMaterial: 'readonly',
                rotateZ: 'readonly',
                PI: 'readonly',
                toxi: 'readonly',
                rotate: 'readonly',
                createVector: 'readonly',
                pop: 'readonly',
                resizeCanvas: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-empty': 'warn',
            'no-prototype-builtins': 'off',
            'no-redeclare': 'off'
        }
    },
    {
        files: ['**/*.mjs'],
        languageOptions: {
            sourceType: 'module'
        }
    }
];
