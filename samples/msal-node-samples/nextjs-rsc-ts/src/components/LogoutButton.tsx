"use client";

import Button from "@mui/material/Button";

async function logout() {
  await fetch("/auth/logout", {
    method: "POST",
  });
  window.location.reload();
}

export default function LogoutButton() {
  return (
    <Button variant="contained" color="primary" onClick={logout}>
      Logout using Route Handler
    </Button>
  );
}
