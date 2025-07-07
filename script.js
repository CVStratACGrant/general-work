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
        //returns promise because its async 
        const response = await fetch('https://waterservices.usgs.gov/nwis/iv/?sites=11109700&agencyCd=USGS&parameterCd=00054&period=P7D&siteStatus=all&format=json');
        const data = await response.json();
        const dataLength = data.value.timeSeries[0].values[0].value.length;
        const mostRecent = data.value.timeSeries[0].values[0].value[dataLength-1].value;

        // 1 -(water level / 83240 acre feet) = percent below capacity 
        const currWaterLevel = 1-(mostRecent/83240)
    }


}

customElements.define('widget-base', WidgetBase)