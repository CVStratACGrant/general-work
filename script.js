//https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json

class WidgetBase extends HTMLElement {
    constructor () {
        super();

        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = `
            <style>
                h1 {
                    color: blue;
                }
            </style>

            <div>
                <h1>Hello</h1>
                <button id="fetch-data-button">Fetch Data</button>
            </div>
        `;
    }


    connectedCallback () {
        this.shadowRoot.getElementById('fetch-data-button').addEventListener('click', () => this.fetchWaterLevel())
    }

    async fetchWaterLevel () {
        const response = await fetch('https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json');
        const data = await response.json();
        const dataLength = data.value.timeSeries[0].values[0].value.length;
        const mostRecent = data.value.timeSeries[0].values[0].value[dataLength-1].value;

        // 1 -(water level / 83240 acre feet) = percent below capacity 
        const percentToCapacity = (1 - (mostRecent / 83240)) * 100
        this.getWhitewaterRaftingStatus(percentToCapacity);
    }

    getWhitewaterRaftingStatus (percentToCapacity) {
        if (percentToCapacity > 90) console.log('Water is about to be released. Whitewater rafting is closed.', percentToCapacity);
        else if (percentToCapacity > 70) console.log('Water is being released. Whitewater rafting is open.', percentToCapacity);
        else console.log('Water has been released. Whitewater rafting is closed.', percentToCapacity);
    }

}

customElements.define('widget-base', WidgetBase)