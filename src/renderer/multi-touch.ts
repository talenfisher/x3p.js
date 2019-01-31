interface MultiTouchOptions {
    el: HTMLElement;
    camera: any;
}

export default class MultiTouch {
    private el: HTMLElement;
    private camera: any;
    private cache: any[] = [];

    constructor(options: MultiTouchOptions) {
        this.camera = options.camera;
        this.el = options.el;
        this.el.addEventListener("touchstart", this.start.bind(this));
        this.el.addEventListener("touchmove", this.move.bind(this));
    }

    public start(e: any) {
        e.preventDefault();
        e.stopPropagation();

        if(e.targetTouches.length === 2) {
            for(let event of e.targetTouches) {
                this.cache.push(event);
            }
        }
    }

    public move(e: any) {
        e.preventDefault();
        e.stopPropagation();
        if(e.targetTouches.length < 2) return;

        let p1, p2;
        let c1 = e.targetTouches[0];
        let c2 = e.targetTouches[1];

        for(let event of this.cache) {
            if(event.identifier === c1.identifier) p1 = event;
            if(event.identifier === c2.identifier) p2 = event;
        }
        
        let dxp = Math.abs(p1.clientX - p2.clientX);
        let dyp = Math.abs(p1.clientY - p2.clientY);

        let dxc = Math.abs(c1.clientX - c2.clientY);
        let dyc = Math.abs(c1.clientY - c2.clientY);

        let dx = dxp / dxc;
        let dy = dyp / dyc;
        let d = Math.max(dx, dy);

        if(d === dx && dxp > dxc) d = -d;
        if(d === dy && dyp > dyc) d = -d;

        let speed = this.camera.zoomSpeed;
        this.camera.pan(0, 0, (-speed * d) / 50);
    }
}
