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
import { useMsal } from "../composition-api/useMsal";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";
import { reactive, onMounted, watch } from 'vue'
import { loginRequest } from "../authConfig";
import { callMsGraph } from "../utils/MsGraphApiCall";
import UserInfo from "../utils/UserInfo";

const { instance, inProgress } = useMsal();

const state = reactive({
	resolved: false,
	data: {} as UserInfo
});

async function getGraphData() {
    const response = await instance.acquireTokenSilent({
        ...loginRequest
    }).catch(async (e) => {
        if (e instanceof InteractionRequiredAuthError) {
            await instance.acquireTokenRedirect(loginRequest);
        }
        throw e;
    });
	if (inProgress.value === InteractionStatus.None) {
		const graphData = await callMsGraph(response.accessToken);
		state.data = graphData;
		state.resolved = true;
		stopWatcher();
	}
}

onMounted(() => {
	getGraphData();
});

const stopWatcher = watch(inProgress, () => {
	if (!state.resolved) {
		getGraphData();
	}
});
</script>
