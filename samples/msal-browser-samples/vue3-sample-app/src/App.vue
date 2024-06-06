<template>
  <div>
    <NavBar />
    <img alt="Vue logo" src="./assets/logo.png">
    <h1>Welcome to the Microsoft Authentication Library For Vue Quickstart</h1>
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import NavBar from "./components/NavBar.vue";

export default defineComponent({
  name: 'App',
  components: {
    NavBar
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}
</style>
