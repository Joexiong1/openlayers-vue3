import { createRouter, createWebHistory } from 'vue-router';
import HomeComponent from '../views/HomeComponent.vue';

const routes=[
    {
        path:'/',
        name:'Home',
        component:HomeComponent
    }   
]

const router=createRouter({
    history: createWebHistory(),
    routes,
})

export default router;
