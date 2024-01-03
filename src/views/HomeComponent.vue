<template>
<div class="home">
  <div id="map" class="map" ></div>
  <div id="popup" class="popup" v-show="shopPopup">
    <div class="info">
      <ul>
        <li>信息1：xxx</li>
        <li>信息2：xxx</li>
        <li>信息3：xxx</li>
      </ul>
      <div class="btns-box">
        <el-button @click="handleOperate('dialog-route')">
          历史轨迹
        </el-button>
      </div>
    </div>
  </div>

  <div id="fencemap" class="fencemap" v-show="showMenu" >
    <el-button @click="handleOperate('dialog-fence')">新增围栏</el-button>
  </div>
  

<!-- 图源选择 -->
  <div class="map-toolbar">
    <el-select v-model="locaMap" style="width:150px">
      <el-option
      v-for="item in mapList"
      :label="item.name"
      :value="item.id"
      :key="item.id"
      @click="setMapSource(item)"
      >
      </el-option>
    </el-select>
    <!--地图围栏-->
<el-select v-model="fence" style="width:150px">
  <el-option
  label="不显示围栏"
  value="-1"
  key="-1"
  @click="handleSelectFence(null)"
  >
  </el-option>

  <el-option
  v-for="(item,index) in fences"
  :label="item.name"
  :value="item.name"
  :key="index"
  @click="handleSelectFence(item)"
  >
  </el-option>

</el-select>
  </div>


<!-- 组件容器-->
<component
  v-if="operateDialogVisible"
  :is="currentComponent"
  :visible="operateDialogVisible"
  :location="position"
  @close="handleOperateClose"
></component>
</div>
</template>

<script>
import 'ol/ol.css';
import { Map, View, Feature, Overlay } from "ol";
import TileLayer from 'ol/layer/Tile';
import {Style, Fill, Stroke, Circle as sCircle} from "ol/style";
import * as olProj from "ol/proj";
import { Vector as VectorLayer } from "ol/layer";
import { Cluster, Vector as VectorSource } from "ol/source";
import mapType from "@/utils/openlayers/maptype" 
import { Text } from 'ol/style';
import { boundingExtent } from 'ol/extent';
import { getMap, setMap } from "@/utils/webStorage";
import DialogFence from "@/components/FencesComponent.vue";
import DialogRoute from "@/components/RouteComponent.vue";
import { mapGetters } from 'vuex';
import { Point, Polygon, Circle as gCircle } from "ol/geom";


//import { withScopeId } from 'vue';
//import OSM from 'ol/source/OSM';
//import GeoJSON from 'ol/format/GeoJSON';



export default {
  name: 'HomeComponent',
  components:{
    DialogFence,
    DialogRoute
  },

  //获取围栏数据
  computed:{
    ...mapGetters(["fences"]),
  },

  data(){
    return{
      openMap:null,

      //地图列表
      tileLayer: null, // 地图层
      mapList:null,
      locaMap:getMap() || "1",
      showMenu:false,
      
      //围栏
      fence:null,
      fenceVector: null, // 围栏层
      operateDialogVisible: false,
      currentComponent: null,
      position: null, 

      //点弹窗
      popup: null,
      shopPopup: false,
      
      //坐标
      markerLayer:null,    //坐标标记层
      markerSource:null,  //坐标数据源
    }
  },
  methods:{
    //初始化
    initMap(){
      this.openMap=new Map({
      target: 'map',
      layers: [
        this.tileLayer
        /*new VectorLayer({
          source:new VectorSource({
            format:new GeoJSON(),
            url:'./data/countries.json'
          })
        })矢量图层数据源
        new TileLayer({
          source: new XYZ({
              url: "https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}",
            }),
        })高德*/
      ],
      view: new View({
        center: olProj.fromLonLat([108.945951, 34.465262]),
        zoom: 7
      }),
      controls:[],
    });

    
    },

    //设置标记点
    setMarker(){
      this.setMarkerSource();
      let _style = this.setClusterStyle();
      this.markerLayer = new VectorLayer({
        source: this.markerSource,
        style:_style,
      });
      this.openMap.addLayer(this.markerLayer);
  },

  pointer(){
  this.openMap.on("pointermove",(e)=>{
    if(this.openMap.hasFeatureAtPixel(e.pixel)){
      this.openMap.getViewport().style.cursor="pointer";
    }
    else{
      this.openMap.getViewport().style.cursor="inherit";
    }
  })
},

//点击事件
singleclick() {
  // 点击
  this.resolutionChange();
  this.openMap.on("singleclick", (e) => {
    this.showMenu  = false;
    this.markerLayer.getFeatures(e.pixel).then((clickedFeatures) => {
      if (clickedFeatures.length) {
        const features = clickedFeatures[0].get("features");
        if (features.length > 1) {
          const extent = boundingExtent(
            features.map((r) => r.getGeometry().getCoordinates())
          );  
          this.openMap
            .getView()
            .fit(extent, { duration: 5000, padding: [300, 300, 300, 300] });
        } else {
          this.shopPopup = true;
          // 设置弹窗位置
          let coordinates = features[0].getGeometry().getCoordinates();
          this.position=coordinates;
          this.popup.setPosition(coordinates);
        }
      } else {
        this.shopPopup = false;
      }
    });
  });
},

//添加弹窗
addOverlay(){
  let elPopup=window.popup;
  let elFence=window.fencemap;
  
  this.popup=new Overlay({
    element:elPopup,
    positioning:"bottom-center",
    stopEvent:false,
    offset:[0,-20],
  });
  this.fence=new Overlay({
    element:elFence,
    offset:[0,-10],
  })

  this.openMap.addOverlay(this.popup);
  this.openMap.addOverlay(this.fence);
},

setMapSource(e){
  this.tileLayer.setSource(e.value);
  setMap(e.id);
},

//标记点坐标（静态直接返回，可以改成接口获取）
getPoints() {
  return [
    [108.945951, 34.465262],
    [109.04724, 34.262504],
    [108.580321, 34.076162],
    [110.458983, 35.071209],
    [105.734862, 35.49272],
  ];
},

//监听缩放
resolutionChange() {
  // 监听缩放
  this.openMap.getView().on("change:resolution", (e) => {
    this.shopPopup = false;
    this.showMenu=false;
  });
},

//
setMarkerSource() {
  let _style = new Style({
    image: new sCircle({
      radius: 10,
      stroke: new Stroke({
        color: "#fff",
      }),
      fill: new Fill({
        color: "#3399CC",
      }),
    }),
  });
  let _points = this.getPoints();
  let _features = _points.reduce((list, item) => {
    let _feature = new Feature({
      geometry: new Point(olProj.fromLonLat(item)),
    });
    _feature.setStyle(_style);
    list.push(_feature);
    return list;
  }, []);
  this.markerSource = new Cluster({
    distance:100,
    source:new VectorSource({
      features: _features,    
    })
  });
},


//设置集群点样式
setClusterStyle() {
  const styleCache = {};
  const _style = (feature) => {
    const size = feature.get("features").length;
    let style = styleCache[size];
    if (!style) {
      if (size > 1) {
        style = new Style({
          image: new sCircle({
            radius: 20,
            stroke: new Stroke({
              color: "#fff",
            }),
            fill: new Fill({
              color: "#3399CC",
            }),
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: "#fff",
            }),
          }),
        });
      } else {
        style = new Style({
          image: new sCircle({
            radius: 15,
            stroke: new Stroke({
              color: "#fff",
            }),
            fill: new Fill({
              color: "#e9b626",
            }),
          }),
        });
      }
      styleCache[size] = style;
    }
    return style;
  };
  return _style;
},


//右键点击事件
rightclick(){
  this.openMap.getViewport().addEventListener("contextmenu",(e)=>{
    e.preventDefault();
    this.showMenu=true;
    let coordinates=this.openMap.getEventCoordinate(e);
    this.position = coordinates;
    this.fence.setPosition(coordinates);
  })
},

// 打开弹窗
handleOperate(component) {
  this.showMenu = false;
  this.operateDialogVisible = true;
  console.log(component);
  this.currentComponent = component;
},

// 关闭弹窗
handleOperateClose() {
  this.operateDialogVisible = false;
},

//围栏数据转换
areaFormat(area){
    // eslint-disable-next-line
  const point = area.match(/[^\(\)]+(?=\))/g)[0].split(", ");
  if(area.match("Circle")){
    return {
      type:"Circle",
      center:olProj.fromLonLat(point[0].split(" ")),
      radius:Number(point[1]),
    };
  }
  if(area.match("Polygon")){
    const path=[];
    point.forEach((item)=>{
      path.push(olProj.fromLonLat(item.split(" ")));
    });
    return{
      type:"Polygon",
      path:path,
    };
  }
},

//展示围栏
handleSelectFence(data){

  //切换时清除之前的围栏
  if(this.fenceVector){
    this.openMap.removeLayer(this.fenceVector);
  }

  if(!data){
    this.fence=null;
    return false;
  }

  //数据转换
  const area=this.areaFormat(data.area);
  //围栏绘制
  this.setFenceSource(area);
},

//绘制围栏
setFenceSource(area){
  let feature;
  switch(area.type){
       case "Circle":{
          feature=new Feature(new gCircle(area.center, area.radius));
          break;
        }
        case "Polygon":{
          feature= new Feature(new Polygon([area.path]));
          break;
        }
        default: break;
  }
  //缩放
  this.mapFit(feature.getGeometry());

  //矢量图层
  let source=new VectorSource({
    features:[feature],
  });
  let vector=new VectorLayer({
    source,
    style:new Style({
      fill:new Fill({
        color:"rgba(49,173,252, 0.2)",
      }),
      stroke:new Stroke({
        color:"#0099FF",
        width:3,
      }),
      image:new sCircle({
        radius:7,
        fill:new Fill({
          color:"#0099FF",
        })
      })

    })
  })
this.fenceVector=vector;
this.openMap.addLayer(vector);
},

//按边界缩放
mapFit(extent){
  this.openMap.getView().fit(extent,{duration:1000,padding:[200,200,200,200]});
}

},


  mounted() {
    this.mapList = mapType;
    this.tileLayer=new TileLayer({
      source:mapType.find((e)=>e.id===this.locaMap).value,
    });
    this.initMap();
    this.setMarker();
    this.pointer();
    this.singleclick();
    this.rightclick();
    this.addOverlay();
  }
};
</script>

<style>
.map {
  width: 100vw;
  height: 100vh;
  /*background-color: #04041b;*/

}
.popup {
  width: 200px;
  background-color: white;
  padding: 18px;
  border-radius: 10px;
  box-shadow: 0 0 15px rgb(177, 177, 177);
  .info {
    font-size: 14px;
    text-align: left;
    ul {
      padding-left: 0;
    }
  }
}

.fencemap {
  border-radius: 5px;
  padding: 5px;
  background: #fff;
}

.map-toolbar {
  position: absolute;
  bottom: 7px;
  right: 20px;
  padding:10px;
}

</style>