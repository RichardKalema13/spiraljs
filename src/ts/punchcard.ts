// placeholder for punchcard
// TODO to be filled in


class Punchcard {

    private _data: IDataRow[];

    constructor () {
        // constructor function
    }




    public binddata(data:any) {
        // function used to bind data to this object
        this._data = data;

    }




    public get data():any {
        return this._data;
    }


}

