const html = (strings, ...values) => {
  // Simple tagged template literal handler
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
};

const css = (strings, ...values) => {
  // Simple tagged template literal handler
  return strings.reduce((acc, str, i) => acc + str + (values[i] || ''), '');
};

export const slotCode = html`
    <div>
        <span><slot name="earthquake-widget"></slot></span>
        <span><slot name="water-widget"></slot></span>
    </div>
`;

export const waterLevelCode = html`
    <div>
        <div class="container">
            <button id="fetch-data-button">Fetch Data</button>
            <img class="raft" src="./raft.png" />
            <div id="water-level"></div>
            <img class="wave" src="./wave.svg" />

            <div class="raft-label">
                <div id="percent-label"></div>
                <div id="prediction-label"></div>
            </div>
        </div>
    </div>
`;

export const widgetBaseStyling = css`
    <style>
        h1 {
            color: blue;
        }

        #fetch-data-button{
        }

        .container {
            width: 800px;
            height: 500px;
            background-color: #ebfffd;
            position: relative;
            overflow: hidden; /* hide wave overflow */
            border-radius: 12px;
            border: 2px solid #88c0f7;
            z-index: 10;

            display: flex;
            justify-content: center;
            align-items: center;
        }

        .raft{
            opacity: 0%;
            transition: bottom 1.5s ease, opacity 1.5s ease;
        }
        .raft.visible{  
            opacity: 100%;
        }

        #water-level {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 0%;
            background: linear-gradient(
                to top,
                #0a3761,
                #0f4e8a
            );
            border-radius: 0 0 12px 12px;
            transition: height 1.5s ease;
            z-index: 1;
        }

        .wave {
            position: absolute;
            bottom: 0;
            left: 0;
            width: 200%;
            height: 80px;
            z-index: 2;
            opacity: 0;
            filter: blur(0.8px);
            pointer-events: none;
            animation: waveMove 6s linear infinite alternate;
            transform: translateY(20px);
            transition: transform 1.2s ease, bottom 1.5s ease;
        }   

        .visible {
            opacity: 100%;
            transform: translateY(0); /* move up */
        }

        .raft {
            position: absolute;
            left: 50%; /* center horizontally */
            bottom: 0;
            opacity: 0;
            transform: translateX(-50%);
            z-index: 3;
            animation: raftMoveAndRock 6s linear infinite alternate;
            width: 50%;
        }

        @keyframes raftMoveAndRock {
            0% {
                transform: translateX(-50%) rotate(-5deg);
            }
            50% {
                transform: translateX(-50%) rotate(5deg);
            }
            100% {
                transform: translateX(-50%) rotate(-5deg);
            }
        }

        @keyframes waveMove {
            0% {
                transform: translateX(0);
            }
            100% {
                transform: translateX(-50%);
            }
        }

        .raft-label {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 0;
            color: white;
            text-align: center;
            font-weight: bold;
            font-family: sans-serif;
            opacity: 0;
            transition: opacity 1.5s ease;
            z-index: 4;
            pointer-events: none;
            font-size: 1.5rem;
        }

        .raft-label.visible {
            opacity: 1;
        }

        #prediction-label {
            font-weight: normal;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
    </style>
`;
