<template>
  <div class="home">
    <span v-if="!isAuthenticated">Please sign-in to see your profile information.</span>
    <el-button v-else type="primary" v-on:click="goToProfile">Request Profile Information</el-button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useIsAuthenticated } from "../composition-api/useIsAuthenticated";

const isAuthenticated = useIsAuthenticated();

const router = useRouter();

function goToProfile() {
  router.push("/profile");
}
</script>
