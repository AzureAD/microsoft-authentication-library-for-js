export function isAuthenticationReturn(location) {
    return [location.search, location.hash].some(part => {
        const params = new URLSearchParams(part.slice(1));
        return params.has("state") && ["code", "error", "error_description"].some(name => params.has(name));
    });
}

if (typeof window !== "undefined") {
    if (isAuthenticationReturn(window.location)) {
        document.querySelector("main").hidden = true;
        document.getElementById("status").textContent = "Authentication return";
        await import("./redirect.mjs");
    } else {
        await import("./host.mjs");
    }
}