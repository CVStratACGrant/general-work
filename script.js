

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
            </div>
        `;
    }


    connectedCallback () {
        
    }


}

customElements.define('widget-base', WidgetBase)