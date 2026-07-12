(function () {
  "use strict";

  function initContactForm() {
    var form = document.querySelector("#public-contact-form");
    var status = document.querySelector("#contact-status");
    if (!form) return;

    form.addEventListener("submit", function () {
      var name = (document.querySelector("#contactName").value || "").trim();
      var email = (document.querySelector("#contactEmail").value || "").trim();
      var message = (document.querySelector("#contactMessage").value || "").trim();
      if (!name || !email || !message) {
        status.textContent = "Please fill all fields.";
        status.style.color = "#ff8ea6";
        return;
      }

      var messages = [];
      try {
        messages = JSON.parse(localStorage.getItem("hai_contact_messages") || "[]");
      } catch (error) {
        messages = [];
      }
      messages.push({
        name: name,
        email: email,
        message: message,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("hai_contact_messages", JSON.stringify(messages));

      form.reset();
      status.textContent = "Message sent. Thank you!";
      status.style.color = "#7dffb2";
    });
  }

  function initNewsletter() {
    var form = document.querySelector("#newsletter-form");
    var status = document.querySelector("#newsletter-status");
    if (!form) return;

    form.addEventListener("submit", function () {
      var email = (document.querySelector("#newsletterEmail").value || "").trim();
      if (!email) return;
      var list = [];
      try {
        list = JSON.parse(localStorage.getItem("hai_newsletter") || "[]");
      } catch (error) {
        list = [];
      }
      if (list.indexOf(email) === -1) list.push(email);
      localStorage.setItem("hai_newsletter", JSON.stringify(list));
      form.reset();
      status.textContent = "Subscribed successfully.";
      status.style.color = "#7dffb2";
    });
  }

  function initBackToTop() {
    var btn = document.querySelector("#back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 400);
    });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initMobileMenu() {
    var btn = document.querySelector("#mobile-menu-btn");
    var sidebar = document.querySelector("#section-sidebar");
    if (!btn || !sidebar) return;
    btn.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  function initSectionSearch() {
    var input = document.querySelector("#section-search");
    var nav = document.querySelector("[data-nav]");
    if (!input || !nav) return;

    input.addEventListener("input", function () {
      var q = (input.value || "").toLowerCase().trim();
      nav.querySelectorAll("a").forEach(function (link) {
        var text = (link.textContent || "").toLowerCase();
        link.style.display = !q || text.indexOf(q) > -1 ? "" : "none";
      });
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("show");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add("show");
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initContactForm();
    initNewsletter();
    initBackToTop();
    initMobileMenu();
    initSectionSearch();
    initReveal();
  });
})();
