<template>
    <div>
        <el-dialog
        title="历史轨迹"
        v-model="dialogVisible"
        class="route"
        width="1200px"
        destroy-on-close
        >
        <div id="fence-map" class="map-box"></div>
        <div class="map-area">
        <el-card class="tool-window" style="width:380px">
        <el-date-picker
        v-model="dateRange"
        type="daterange"
        value-format="yyyy-MM-dd"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        width="100:100%">
        </el-date-picker>
        <div style="margin-top:15px">
            <el-button type="primary" @click="getList">查询</el-button>
        </div>
        </el-card>
        </div>
        </el-dialog>
    </div>
</template>

<script>
import {Feature, Map,View} from "ol";
import { Vector as VectorSource } from "ol/source";
import {Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import * as olProj from "ol/proj";
import { Style, Fill, Stroke, Circle as sCircle } from "ol/style";
import { Point, LineString } from "ol/geom";


import {getMap} from "@/utils/webStorage";
import mapType from "@/utils/openlayers/maptype"

export default{
    props:{
        visible:{
            type:Boolean,
            default:false
        },
        location:{
            type:Array,
            default:()=>{
                return [];
            }
        }
    },
    data(){
        return {
            dialogVisible:false,
            locaMap:null,
            openMap:null,
            dateRange: [],
            routeSource:null,
        };
    },
    watch:{
        visible:{
            handler:function(value){
                if(value){
                    this.dialogVisible=true;
                    this.locaMap=getMap() || "0";
                    this.$nextTick(()=>{
                        this.initMap();
                    })
                }
            },
            immediate:true,
        },
       
    },

    mounted(){},
    methods:{
        //地图初始化
        initMap(){
            const _maplist=mapType;
            const _tileLayer=new TileLayer({
                source:_maplist.find((e)=>e.id===this.locaMap).value
            });
            this.routeSource = new VectorSource({ wrapX: false });
            const _vector = new VectorLayer({
                source: this.routeSource,
                style: new Style({
                    stroke: new Stroke({
                        lineDash: [2, 6, 10],
                        width: 4,
                        color: [0, 255, 0, 1],
                    }),
                }),
            });

            this.openMap=new Map({
                target:"fence-map",
                layers:[_tileLayer,_vector],
                view:new View({
                    center:this.location,
                    zoom:10,
                }),
                controls:[],
            });
            this.getList();
        },
        //关闭对话框
        handleClose(){
            this.$emit("close"); 
        },

        //查询数据
        getList(){
            let _data=[
                [108.945951, 34.465262],
                [109.04724, 34.262504],
                [108.580321, 34.076162],
                [110.458983, 35.071209],
                [105.734862, 35.49272],
            ];
            this.routes=_data.map((item)=>{
                return olProj.fromLonLat(item);
            });
            this.drawRoute();
        },


        //绘制轨迹
        drawRoute(){
            if(this.routeGeometry){
                this.routeSource.clear();
            }
            this.routeGeometry = new LineString(this.routes);
            let route = new Feature(this.routeGeometry);
        
            let points=this.drawPoint();
            this.routeSource.addFeatures([route,...points]);
        
            //缩放至轨迹
            this.mapFit();
        },


        //缩放
        mapFit(){
            this.openMap.getView().fit(this.routeGeometry,{
                padding:[120,120,120,120],
            });
        },

        //绘制点
        drawPoint(){
            let iconFeatures=[];
            this.routes.forEach((item)=>{
                let _feature=new Feature(new Point(item));
                let _style=new Style({
                    image:new sCircle({
                        radius:10,
                        stroke:new Stroke({
                            color:"#fff",
                        }),
                        fill:new Fill({
                            color:"#3399CC",
                        })
                    })
                });
                _feature.setStyle(_style);
                iconFeatures.push(_feature);
            });
            return iconFeatures;
        }
    
    
    }
}
</script>

<style scoped>
:deep(.route){
    padding: 0;
    .map-area {
      box-shadow: inset 5em 1em #000000;
      position: relative;
      .tool-window {
        width: 200px;
        position: absolute;
        bottom: 20px;
        right: 20px;
        .button {
          font-size: 20px;
        }
      }
    }
}

.map-box {
  width: 100%;
  height: 60vh;
}
</style>

