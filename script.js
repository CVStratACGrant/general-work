import { widgetBaseStyling, waterLevelCode, slotCode } from "./script2.js";


class WidgetBase extends HTMLElement {
    constructor() {
        super();

        this.widgetBaseStyling = widgetBaseStyling;
        this.waterLevelCode = waterLevelCode;
        this.slotCode = slotCode;

        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            ${this.widgetBaseStyling}
            ${this.slotCode}
            ${this.waterLevelCode}
        `;
    }

    connectedCallback() {
        this.shadowRoot.getElementById('fetch-data-button').addEventListener('click', () => this.fetchWaterLevel());
        this.shadowRoot.querySelector('slot[name="earthquake-widget"]').addEventListener('slotchange', (event) => this.analyzeSlot(event));
        this.shadowRoot.querySelector('slot[name="water-widget"]').addEventListener('slotchange', (event) => this.analyzeSlot(event));
    }

    analyzeSlot(event) {
        const slot = event.target;
        const assignedElements = slot.assignedElements();
        
        for (const element of assignedElements) {
            this.observeAttributes(element);
        }
    }

    observeAttributes(element) {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== 'attributes') continue;
                const name = mutation.attributeName;
                const oldValue = mutation.oldValue;
                const newValue = mutation.target.getAttribute(name);

                console.log(`Attribute changed: ${name}`);
                console.log(`Old Value: ${oldValue}, New Value ${newValue}`);
            }
        })

        observer.observe(element, { attributes: true, attributeOldValue: true })
    }

    async fetchWaterLevel() {
        const response = await fetch('https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json');
        const data = await response.json();
        const dataLength = data.value.timeSeries[0].values[0].value.length;
        const mostRecent = data.value.timeSeries[0].values[0].value[dataLength - 1].value;

        //calculating the water level
        const percentToCapacity = (1 - (mostRecent / 83240)) * 100;

        const { rafting, message } = this.getWhitewaterRaftingStatus(percentToCapacity);

        // TESTING
        this.waveAnimation(85);
        this.labelDisplay(85, true);

        // this.waveAnimation(percentToCapacity);
        // this.labelDisplay(percentToCapacity, rafting);
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

// class WidgetNested1 extends WidgetBase {
//     constructor() {
//         super();

//         this.attachShadow({ mode: 'true' });
//         this.innerHTML = `

//         `;
//     }
// }

customElements.define('widget-base', WidgetBase);