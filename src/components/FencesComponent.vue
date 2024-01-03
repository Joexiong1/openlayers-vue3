<template>
    <div>
        <el-dialog
    title="编辑围栏"
    v-model="dialogVisible"
    class="fence"
    @close="handleClose"
    width="1200px"
    destroy-on-close
    >
    <div id="fence-map" class="map-box"></div>
    <div class="map-area">
      <el-card class="tool-window" style="width: 380px;" >
        <el-form label-width="80px">
          <el-form-item label="围栏名称">
            <el-input
              size="small"
              v-model="name"
              placeholder="请输入围栏名称"
            ></el-input>
          </el-form-item>
          <el-form-item label="围栏样式">
            <el-radio-group v-model="tool" size="small" @change="setType">
              <el-radio-button label="Circle">圆形</el-radio-button>
              <el-radio-button label="Polygon">多边形</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="warning" size="small" @click="handleClear"
              >清除</el-button
            >
            <el-button type="primary" size="small" @click="handleSave"
              >保存</el-button
            >
            <el-button size="small" @click="handleClose">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    </el-dialog>
    </div>
</template>

<script>
import { Map, View } from "ol";
import {  Vector as VectorLayer } from "ol/layer";
import TileLayer from 'ol/layer/Tile';
import { Vector as VectorSource } from "ol/source";
import { Style, Fill, Stroke, Circle as sCircle } from "ol/style";
import { getMap } from "@/utils/webStorage";
import mapType from "@/utils/openlayers/maptype";
import Draw from "ol/interaction/Draw";
import * as olProj from "ol/proj";
  

export default{
    props:{
        visible:{
            type:Boolean,
            default:false,
        },
        location:{
        type:Array,
        default:()=>{
            return [];
        },
    },
    },
   
    data(){
        return {
            dialogVisible:false,
            locaMap:null,
            openMap:null,
            fenceSource:null,
            tileLayer:null,
            fenceDraw:null,
            tool:"Circle",
            name:"",
        }
    },
    watch:{
        visible:{
            handler(newVal){
                if(newVal){
                    this.dialogVisible=true;
                    this.locaMap=getMap()||"0";
                    this.$nextTick(()=>{
                        this.initMap();
                    });
                }
            },
            immediate:true,
        }
    },
    mounted(){},
    methods:{
        initMap(){
            this.tileLayer=new TileLayer({
                source:mapType.find(e=>e.id===this.locaMap).value,
            });
            this.fenceSource=new VectorSource({wrapX: false});

            const _vector=new VectorLayer({
                source:this.fenceSource,
                style:new Style({
                    fill:new Fill({
                        color: "rgba(49,173,252, 0.2)",
                    }),
                    stroke:new Stroke({
                        color: "#0099FF",
                        width: 3,
                    }),
                    image:new sCircle({
                        radius:7,
                        fill:new Fill({
                            color: "#0099FF",
                        })
                    })
                })
            })
        this.openMap=new Map({
            target:"fence-map",
            layers: [this.tileLayer, _vector],
            view:new View({
                center:this.location,
                zoom:5,
            }),
            controls:[],
        });
        this.addInteraction();

    },
        handleClose(){
            this.$emit("close");
        },
        
        //添加互动
        addInteraction(){
            this.fenceDraw=new Draw({
                source:this.fenceSource,
                type:this.tool,
            });
            
            this.openMap.addInteraction(this.fenceDraw);
            this.fenceDraw.on("drawend",(e)=>{
                //绘制完成的回调
                this.drawEnd(e);
            });

            //检测是否重复绘制
            this.mapOnly();
        },

        //切换类型
        setType(){
            this.fenceSource.clear();
            this.openMap.removeInteraction(this.fenceDraw);
            this.addInteraction();
        },

        //按钮方法
        handleClear(){
            this.fenceSource.clear();
        },
        
        
        handleSave(){
            //保存
            if(!this.name){
                this.$message.error("请输入围栏名称");
                return;
            }
            const area=this.formatFenceData();
            if(area){
                let data={
                    name:this.name,
                    area:area,
                };
                this.$store.dispatch('addFences',data);
            }
            console.log(this.$store.getters.fences);

        },


        drawEnd(evt){
            let geo=evt.feature.getGeometry();
            let type = geo.getType(); //获取类型
            const handle={
                Circle:()=>{
                    //获取中心点和半径
                    let center = geo.getCenter();
                    let radius = geo.getRadius();
                    this.circleInfo = {
                                        center: center,
                                        radius: parseInt(radius),
                                        };
                },
                Polygon:()=>{
                    //获取坐标点
                    let points = geo.getCoordinates();
                    this.polygonPath = points[0];
                }
            }
            if (handle[type]) handle[type]();
        },

       // 数据处理
        formatFenceData() {
            const handle = {
            Circle: () => {
                if (!this.circleInfo) {
                    this.$message.error(this.$t("lan_map.lan_map_fences.pdrwf"));
                    return;
                }
                const center = this.circleInfo.center;
                const radius = this.circleInfo.radius;
                const p = olProj.toLonLat(center);
                return `Circle (${p[0]} ${p[1]}, ${radius})`;
            },
            Polygon: () => {
                if (this.polygonPath.length === 0) {
                    this.$message.error(this.$t("lan_map.lan_map_fences.pdrwf"));
                    return;
            }
                const path = this.polygonPath;
                const pathArr = [];
                path.forEach((item) => {
                const p = olProj.toLonLat(item);
                pathArr.push(`${p[0]} ${p[1]}`);
            });
            return `Polygon (${pathArr.join(", ")})`;
            },
        };
        const type = this.tool;
        if (handle[type]) {
            return handle[type]();
        }
    },

    mapOnly(){
        this.fenceDraw.on("drawstart",()=>{
            if(this.tool==="Polygon"){
                //如果已经存在几何则删除，避免多个
                if(this.polygonPath)
                this.fenceSource.clear()&&(this.polygonPath=[]);
            }else{
                if(this.circleInfo)
                this.fenceSource.clear() && (this.circleInfo = null);
            }
        })
    }

    },
};
</script>

<style scoped>
:deep(.fence){
        .map-area {
      box-shadow: inset 5em 1em #000000;
      position: relative;
      .tool-window {
        width: 200px;
        position: absolute;
        bottom: 20px;
        right: 20px;
      }
    }
}
    

.map-box {
  width: 100%;
  height: 60vh;
}
</style>
