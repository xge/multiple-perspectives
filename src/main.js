import "./styles.scss";
import Vue from "vue";
import App from "./App.vue";
import store from "./store";

Vue.config.productionTip = process.env.NODE_ENV !== "production";

import {BootstrapVue, IconsPlugin} from "bootstrap-vue";
Vue.use(BootstrapVue);
Vue.use(IconsPlugin);

import VueJsPanel from "vue-js-panel/src";
Vue.use(VueJsPanel);

new Vue({
  store,
  render: h => h(App)
}).$mount("#app");
