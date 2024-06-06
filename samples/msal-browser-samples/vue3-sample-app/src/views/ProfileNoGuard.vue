<template>
  <div v-if="state.resolved">
	<p>Name: {{ state.data.displayName }}</p>
	<p>Title: {{ state.data.jobTitle }}</p>
	<p>Mail: {{ state.data.mail }}</p>
	<p>Phone: {{ state.data.businessPhones ? state.data.businessPhones[0] : "" }}</p>
	<p>Location: {{ state.data.officeLocation }}</p>
  </div>
</template>

<script setup lang="ts">
import { useMsalAuthentication } from "../composition-api/useMsalAuthentication";
import { InteractionType } from "@azure/msal-browser";
import { reactive, watch } from 'vue'
import { loginRequest } from "../authConfig";
import { callMsGraph } from "../utils/MsGraphApiCall";
import UserInfo from "../utils/UserInfo";

const { result, acquireToken } = useMsalAuthentication(InteractionType.Redirect, loginRequest);

const state = reactive({
	resolved: false,
	data: {} as UserInfo
});

async function getGraphData() {
	if (result.value) {
		const graphData = await callMsGraph(result.value.accessToken).catch(() => acquireToken());
		state.data = graphData;
		state.resolved = true;
	}
}

getGraphData();

watch(result, () => {
	getGraphData();
});
</script>
