<template>
    <el-dropdown>
        <el-button type="primary">Sign In</el-button>
        <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item v-on:click="loginPopup">Login Popup</el-dropdown-item>
                <el-dropdown-item v-on:click="loginRedirect">Login Redirect</el-dropdown-item>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup lang="ts">
import { useMsal } from '../composition-api/useMsal';
import { loginRequest } from "../authConfig";

const { instance } = useMsal();

const loginPopup = () => {
  instance.loginPopup(loginRequest);
}
    
const loginRedirect = () => {
  instance.loginRedirect(loginRequest);
}
</script>
