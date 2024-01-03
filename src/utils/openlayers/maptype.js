import {XYZ,BingMaps} from "ol/source";

let list=[
    {
        name:"高德地图",
        value:new XYZ({
            url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
        }),
        id:"0",
    },
    {
        name:"必应地图",
        value:new BingMaps({
            key:"ApcfcRVhGAUVcIN2JIRgO30Dj7adql256xF358onKJ7EEeVRCIt3o8aewhZFxrg0",
            imagerySet:"RoadOnDemand",
        }),
        id:"1",
    }
]

export default list;