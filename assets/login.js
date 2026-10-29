
"use strict";

document.getElementById("loginForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorBox = document.getElementById("error");
    const button = event.target.querySelector("button");

    errorBox.textContent = "";
    button.disabled = true;

    try {
      await loginFms(email, password);
      window.location.replace("/workflow-home/");
    } catch (error) {
      errorBox.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
