const getUserButton = document.querySelector("button#get-user");
const signOutButton = document.querySelector("button#signout");
const getTokenButton = document.querySelector("button#get-token");
const getAllUsersButton = document.querySelector("button#get-users");

const signInForm = document.querySelector("form#signin");
const signUpForm = document.querySelector("form#signup");
const forgotPasswordForm = document.querySelector("form#forgot-password");
const resetPasswordForm = document.querySelector("form#reset-password");
const userByUsernameForm = document.querySelector("form#user-by-username");
const updateForm = document.querySelector("form#update");
const deleteAccountForm = document.querySelector("form#delete-account");

const resetTokenField = document.querySelector(
  'form#reset-password input[name="resetToken"]'
);

const serverBaseUrl = "http://127.0.0.1:9090";
const userBaseUrl = serverBaseUrl + "/user";

const urlParams = new URLSearchParams(window.location.search);
resetTokenField.value = urlParams.get("token");

// Get User
getUserButton.addEventListener("click", async () => {
  const resp = await fetch(`${userBaseUrl}/`, {
    method: "GET",
    credentials: "include",
  });
  console.log(resp);
  const data = await resp.json();
  console.log(data);
});

// Sign Out
signOutButton.addEventListener("click", async () => {
  const resp = await fetch(`${userBaseUrl}/signout`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Get Token
getTokenButton.addEventListener("click", async () => {
  const resp = await fetch(`${userBaseUrl}/token`, {
    method: "GET",
    credentials: "include",
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Get All Users
getAllUsersButton.addEventListener("click", async () => {
  const resp = await fetch(`${userBaseUrl}/u/`, {
    method: "GET",
    credentials: "include",
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Sign In
signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    username: form.get("username"),
    password: form.get("password"),
  };
  const resp = await fetch(`${userBaseUrl}/signin`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Sign Up
signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    username: form.get("username"),
    email: form.get("email"),
    password: form.get("password"),
    name: form.get("name"),
    avatarUrl: form.get("avatarUrl"),
  };
  const resp = await fetch(`${userBaseUrl}/signup`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Forgot Password
forgotPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    email: form.get("email"),
  };
  const resp = await fetch(`${userBaseUrl}/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Reset Password
resetPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    password: form.get("password"),
    resetToken: form.get("resetToken"),
  };
  console.log("fields", fields);
  const resp = await fetch(`${userBaseUrl}/reset-password`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});

// User by username
userByUsernameForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    username: form.get("username"),
  };
  const resp = await fetch(`${userBaseUrl}/u/${fields.username}`, {
    method: "GET",
    credentials: "include",
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Update
updateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    username: form.get("username"),
    email: form.get("email"),
    name: form.get("name"),
    avatarUrl: form.get("avatarUrl"),
  };
  if (!fields.username) delete fields.username;
  if (!fields.email) delete fields.email;
  if (!fields.name) delete fields.name;
  if (!fields.avatarUrl) delete fields.avatarUrl;
  const resp = await fetch(`${userBaseUrl}/update`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});

// Delete Account
deleteAccountForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const fields = {
    password: form.get("password"),
  };
  const resp = await fetch(`${userBaseUrl}/delete`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(fields),
  });
  const data = await resp.json();
  console.log(resp, data);
});
