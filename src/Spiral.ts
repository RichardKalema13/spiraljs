import * as d3 from 'd3';

import { Cartesian }         from './basechart';
import { ICoordinate }       from './basechart';
import { Complex }           from './Complex';
import { fft }               from './fourier';
import { LineChart }         from './LineChart';
import { TimedBubbleSpiral } from './TimedBubbleSpiral';
import { TimedDataRow}       from './TimedDataRow';

class Spiral {
    public _data: TimedDataRow[];
    public chart: TimedBubbleSpiral<IDataRow>;
    private hist_chart: LineChart;
    private power_chart: LineChart;

    private histogram: any;
    private _hist_fn: d3.layout.Histogram<TimedDataRow>;
    private _hist_data: ICoordinate[];
    private _power_data: ICoordinate[];

    constructor (id_tag: string) {
        this.chart = new TimedBubbleSpiral<IDataRow>(d3.select('#' + id_tag));
        this.hist_chart = new LineChart(d3.select('#spiral-hist'));
        this.power_chart = new LineChart(d3.select('#spiral-power'));

        this.hist_chart.chartHeight = 200;
        this.power_chart.chartHeight = 200;

        this._hist_fn = d3.layout.histogram<TimedDataRow>()
            .value(x => x.date.valueOf())
            .bins(2049);

        // constructor function
        const chart = this.chart;
        d3.select('#spiral-slider').on('input', function() {
            const s: number = 1. / this.value;
            chart.period_seconds = s * 3600 * 24;
            chart.update(that._data);
            d3.select('#spiral-value').text('Period: ' + s.toString() + 'days');
        });

        d3.select('#spiral-slider')
            .style('width', '730px')
            .style('margin-left', '50px');
    }

    public set data(newdata: IDataRow[]) {
        // function used to bind data to this object
        this._data = newdata.map((row) => new TimedDataRow(row));
//        console.log(TimedDataRow.color_map);
        const min_date = Math.min.apply(null, this._data.map((row) => row.date));
        const max_date = Math.max.apply(null, this._data.map((row) => row.date));
//        console.log(new Date(min_date));
        this.chart.time_scale = d3.time.scale().range([0, 1]).domain([min_date, max_date]);
        this.chart.radius_map = (row: TimedDataRow) => 5;
        //this.chart.period_fraction = 1 / 5;
        this.chart.period = d3.time.day;

        this.histogram = this._hist_fn(this._data).slice(1);
        this._hist_data = this.histogram.map(
            a => new Cartesian((a.x + a.dx / 2) / (1000 * 3600 * 24), a.y));

        const N = this._hist_data.length;
        const L = (this.histogram[this.histogram.length - 1].x - this.histogram[0].x)
            / (1000 * 3600 * 24);
        const kspace = (i: number) => {
            if (i <= N / 2) {
                return i / L;
            } else {
                return (i - N) / L;
            }
        };

        this._power_data = fft(this._hist_data.map(a => new Complex(a.y, 0)))
            .map((y, x) => new Cartesian(kspace(x), y.norm2() * Math.PI / N));
//        console.log(this.histogram[0].dx);

        d3.select('#spiral-slider')
            .attr('max', kspace(N / 2));
    }

    public get data(): IDataRow[] {
        return this._data.map((d) => d.record);
    }

    public render() {
        this.chart.data = this._data;
        this.chart.render();
        this.hist_chart.render(this._hist_data);
        this.power_chart.render(this._power_data.slice(1, this._power_data.length / 2));
    }
}