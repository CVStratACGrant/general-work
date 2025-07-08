//script.js

//https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json

export class WidgetBase extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
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

            <div>
                <div class="container">
                    <button id="fetch-data-button">Fetch Data</button>
                    <img class="raft" src="https://cdn.jsdelivr.net/gh/CVStratACGrant/general-work@main/raft.png" />
                    <div id="water-level"></div>
                    <img class="wave" src="https://cdn.jsdelivr.net/gh/CVStratACGrant/general-work@main/wave.svg" />

                    <div class="raft-label">
                        <div id="percent-label"></div>
                        <div id="prediction-label"></div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('fetch-data-button')
            .addEventListener('click', () => this.fetchWaterLevel());
    }

    async fetchWaterLevel() {
        const response = await fetch('https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json');
        const data = await response.json();
        const dataLength = data.value.timeSeries[0].values[0].value.length;
        const mostRecent = data.value.timeSeries[0].values[0].value[dataLength - 1].value;

        //calculating the water level
        const percentToCapacity = (1 - (mostRecent / 83240)) * 100;
        //const percentToCapacity = 76;

        const { rafting, message } = this.getWhitewaterRaftingStatus(percentToCapacity);

        this.waveAnimation(percentToCapacity);
        this.labelDisplay(percentToCapacity, rafting);
        this.predict(data);
    }

    predict(data){
        const values = data.value.timeSeries[0].values[0].value;
        const allPoints = values.map(d => ({
            time: new Date(Date.parse(d.dateTime)),
            value: parseFloat(d.value)
        }));

        // sorting times chronologically 
        allPoints.sort((a, b) => a.time - b.time);

        const first = allPoints[0];
        const last = allPoints[allPoints.length - 1];

        const deltaTime = last.time - first.time;
        const deltaValue = last.value - first.value;
        const deltaPercent = (deltaValue / 83240) * 100;

        const predictionLabel = this.shadowRoot.getElementById('prediction-label');

        // if there's no change
        if (deltaPercent === 0 || deltaTime === 0) {
            predictionLabel.textContent = "No change in water level. Cannot estimate whitewater rafting opening time.";
            return;
        }

        // calculate rate of change (% per ms)
        const ratePerMs = deltaPercent / deltaTime;

        if (ratePerMs <= 0) {
            predictionLabel.textContent = "Water level is not rising; no predicted whitewater rafting opening time.";
            return;
        }

        const currentPercent = (last.value / 83240) * 100;
        const percentTo70 = 70 - currentPercent;

        if (percentTo70 <= 0) {
            predictionLabel.textContent = "Water level is above 70%. White water rafting is open.";
        } else {
            const timeNeededMs = percentTo70 / ratePerMs;
            const estimatedOpenTime = new Date(last.time.getTime() + timeNeededMs);
            predictionLabel.textContent = `Estimated time to reach 70%: ${estimatedOpenTime.toLocaleString()}`;
        }
    }

    labelDisplay(percentToCapacity, rafting){
        const raftLabel = this.shadowRoot.querySelector('.raft-label');
        const percentLabel = this.shadowRoot.getElementById('percent-label');

        raftLabel.style.bottom = `calc(${percentToCapacity / 2}%)`;
        raftLabel.classList.add('visible');

        percentLabel.textContent = `${percentToCapacity.toFixed(1)}% until capacity`;

        // Show raft only if rafting is true
        const raft = this.shadowRoot.querySelector('.raft');
        if (rafting) {
            raft.style.bottom = `calc(${percentToCapacity - 1}% - 50px)`;
            raft.classList.add('visible');
        } else {
            raft.classList.remove('visible');
        }
    }

    waveAnimation(percentToCapacity){
        const waterLevelDiv = this.shadowRoot.getElementById('water-level');
        waterLevelDiv.style.height = `${percentToCapacity}%`;

        const waveSvg = this.shadowRoot.querySelector('.wave');
        waveSvg.style.bottom = `${percentToCapacity - 1}%`;
        waveSvg.classList.add('visible');
    }

    getWhitewaterRaftingStatus(percentToCapacity) {
        if (percentToCapacity > 90) {
            return { rafting: false, message: 'Water is about to be released. Whitewater rafting is closed.' };
            
        } else if (percentToCapacity > 70) {
            return { rafting: true, message: 'Water is being released. Whitewater rafting is open.' };
        } else {
            return { rafting: false, message: 'Water has been released. Whitewater rafting is closed.' };
        }
    }
}

customElements.define('widget-base', WidgetBase);

