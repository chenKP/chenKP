(function () {
  "use strict";

  const data = window.SITE_DATA;
  const state = {
    lang: localStorage.getItem("kc-language") || "en",
    theme: localStorage.getItem("kc-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
    publicationView: "selected",
    publicationFilter: "All"
  };
  const navIds = ["home", "about", "research", "publications", "projects", "experience", "service", "cv", "contact"];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const t = (key) => data.i18n[state.lang][key] || "";

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
    $("#theme-icon").textContent = state.theme === "dark" ? "☀" : "◐";
    $("#theme-toggle").setAttribute("aria-label", state.theme === "dark" ? "Use light theme" : "Use dark theme");
  }

  function renderStaticText() {
    document.documentElement.lang = state.lang === "en" ? "en" : "zh-CN";
    $$("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (Object.prototype.hasOwnProperty.call(data.i18n[state.lang], key)) element.textContent = t(key);
    });
    $("#language-toggle").textContent = state.lang === "en" ? "中文" : "English";
  }

  function renderNav() {
    $("#nav-links").innerHTML = navIds.map((id, index) =>
      `<a href="#${id}" data-section="${id}">${escapeHtml(t("nav")[index])}</a>`
    ).join("");
  }

  function linkButton(label, url, className = "button button-secondary") {
    return url ? `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>` : "";
  }

  function renderHero() {
    $("#hero-keywords").innerHTML = t("keywords").map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const cfg = data.config;
    const cvAction = cfg.cv.available ? `<a class="button button-secondary" href="${cfg.cv.url}" download>${escapeHtml(t("downloadCV"))}</a>` : "";
    $("#hero-actions").innerHTML = [
      `<a class="button button-primary" href="#research">${escapeHtml(t("viewResearch"))}</a>`,
      `<a class="button button-secondary" href="#publications">${escapeHtml(t("publicationsButton"))}</a>`,
      cvAction,
      linkButton("Google Scholar", cfg.links.googleScholar),
      linkButton("ORCID", cfg.links.orcid),
      linkButton("GitHub", cfg.links.github),
      `<a class="button button-text" href="#contact">${escapeHtml(t("contactMe"))} <span aria-hidden="true">→</span></a>`
    ].join("");
    $("#quick-facts").innerHTML = t("facts").map(([key, value]) =>
      `<div><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd></div>`
    ).join("");
  }

  function renderAbout() {
    $("#about-copy").innerHTML = t("about").map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
  }

  function renderResearch() {
    $("#research-cards").innerHTML = t("interests").map(([title, copy], index) =>
      `<article class="research-card"><span class="card-index">${String(index + 1).padStart(2, "0")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(copy)}</p></article>`
    ).join("");
  }

  function emphasizeName(authors) {
    return escapeHtml(authors)
      .replace(/Kangping Chen/g, "<strong>Kangping Chen</strong>")
      .replace(/Chen, K\./g, "<strong>Chen, K.</strong>");
  }

  function renderPublications() {
    const categories = ["All", ...new Set(data.publications.map((item) => item.category))];
    $("#publication-filters").innerHTML = categories.map((category) =>
      `<button type="button" class="filter-button ${state.publicationFilter === category ? "active" : ""}" data-filter="${escapeHtml(category)}">${escapeHtml(category === "All" ? t("allFilter") : category)}</button>`
    ).join("");
    $$(".segment").forEach((button) => button.classList.toggle("active", button.dataset.view === state.publicationView));
    const items = data.publications.filter((item) =>
      (state.publicationView === "all" || item.selected) &&
      (state.publicationFilter === "All" || item.category === state.publicationFilter)
    );
    $("#publication-list").innerHTML = items.map((item, index) => {
      const availableLinks = Object.entries(item.links).filter(([, url]) => url);
      const links = availableLinks.length ? `<div class="publication-links">${availableLinks.map(([label, url]) => linkButton(label === "bibtex" ? "BibTeX" : label[0].toUpperCase() + label.slice(1), url, "text-link")).join("")}</div>` : "";
      return `<article class="publication">
        <div class="publication-number">${String(index + 1).padStart(2, "0")}</div>
        <div>
          <div class="publication-meta"><span>${escapeHtml(item.category)}</span>${item.underReview ? '<span class="review-status">Under review</span>' : ""}</div>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="authors">${emphasizeName(item.authors)}</p>
          <p class="venue">${escapeHtml(item.venue)}</p>
          ${links}
        </div>
      </article>`;
    }).join("");
    $$(".filter-button").forEach((button) => button.addEventListener("click", () => {
      state.publicationFilter = button.dataset.filter;
      renderPublications();
    }));
  }

  function renderProject(item, technical) {
    const details = technical && item.bullets
      ? `<ul>${item.bullets[state.lang].map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
      : `<p>${escapeHtml(item.description[state.lang])}</p>`;
    return `<article class="project-card ${item.priority ? "priority" : ""}">
      <div class="project-meta"><span>${escapeHtml(item.period)}</span><span>${escapeHtml(item.role)}</span></div>
      <h4>${escapeHtml(item.title)}</h4>
      ${item.organization ? `<p class="organization">${escapeHtml(item.organization)}</p>` : ""}
      ${details}
    </article>`;
  }

  function renderProjects() {
    $("#research-projects").innerHTML = data.researchProjects.map((item) => renderProject(item, false)).join("");
    $("#technical-projects").innerHTML = data.technicalProjects.map((item) => renderProject(item, true)).join("");
  }

  function renderTimeline(items, target) {
    $(target).innerHTML = items.map((item) =>
      `<article class="timeline-item"><time>${escapeHtml(item.period)}</time><h4>${escapeHtml(item.title)}</h4><p class="organization">${escapeHtml(item.place)}</p>${item.detail[state.lang] ? `<p>${escapeHtml(item.detail[state.lang])}</p>` : ""}</article>`
    ).join("");
  }

  function renderExperience() {
    renderTimeline(data.education, "#education-list");
    renderTimeline(data.work, "#work-list");
    $("#skills-list").innerHTML = data.skills.map(([title, list]) =>
      `<div class="skill-group"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(list)}</p></div>`
    ).join("");
  }

  function renderService() {
    $("#journal-list").innerHTML = data.journals.map((journal) =>
      `<div><span aria-hidden="true">✓</span><p>${escapeHtml(journal)}</p></div>`
    ).join("");
  }

  function renderCV() {
    $("#cv-action").innerHTML = data.config.cv.available
      ? `<a class="button button-primary" href="${escapeHtml(data.config.cv.url)}" download>${escapeHtml(t("downloadCV"))}</a>`
      : `<span class="availability-note">${escapeHtml(t("cvComingSoon"))}</span>`;
  }

  function renderContact() {
    const links = data.config.links;
    const primaryEmail = links.academicEmail || links.personalEmail;
    const emailRows = [
      links.academicEmail ? `<div><span>${escapeHtml(t("academicEmail"))}</span><a href="mailto:${escapeHtml(links.academicEmail)}">${escapeHtml(links.academicEmail)}</a></div>` : "",
      links.personalEmail ? `<div><span>${escapeHtml(t("personalEmail"))}</span><a href="mailto:${escapeHtml(links.personalEmail)}">${escapeHtml(links.personalEmail)}</a></div>` : ""
    ].join("");
    const social = [
      linkButton("Google Scholar", links.googleScholar, "text-link"),
      linkButton("ORCID", links.orcid, "text-link"),
      linkButton("GitHub", links.github, "text-link")
    ].join("");
    $("#contact-card").innerHTML = `
      ${emailRows || `<div><span>${escapeHtml(t("academicEmail"))}</span><strong>${escapeHtml(t("emailPending"))}</strong></div>`}
      <div><span>${escapeHtml(t("location"))}</span><strong>Lanzhou, China</strong></div>
      ${primaryEmail ? `<button class="button button-primary" id="copy-email" type="button" data-email="${escapeHtml(primaryEmail)}">${escapeHtml(t("copyEmail"))}</button>` : ""}
      ${social ? `<div class="contact-links">${social}</div>` : ""}`;
    const copyButton = $("#copy-email");
    if (copyButton) copyButton.addEventListener("click", async () => {
      await navigator.clipboard.writeText(copyButton.dataset.email);
      copyButton.textContent = t("copied");
      setTimeout(() => { copyButton.textContent = t("copyEmail"); }, 1600);
    });
  }

  function renderAll() {
    renderStaticText();
    renderNav();
    renderHero();
    renderAbout();
    renderResearch();
    renderPublications();
    renderProjects();
    renderExperience();
    renderService();
    renderCV();
    renderContact();
    attachNavBehavior();
  }

  function attachNavBehavior() {
    $$("#nav-links a").forEach((link) => link.addEventListener("click", closeMenu));
  }

  function closeMenu() {
    $(".nav-menu").classList.remove("open");
    $(".nav-toggle").setAttribute("aria-expanded", "false");
  }

  $(".nav-toggle").addEventListener("click", () => {
    const open = $(".nav-menu").classList.toggle("open");
    $(".nav-toggle").setAttribute("aria-expanded", String(open));
  });
  $("#language-toggle").addEventListener("click", () => {
    state.lang = state.lang === "en" ? "zh" : "en";
    localStorage.setItem("kc-language", state.lang);
    renderAll();
  });
  $("#theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("kc-theme", state.theme);
    applyTheme();
  });
  $$(".segment").forEach((button) => button.addEventListener("click", () => {
    state.publicationView = button.dataset.view;
    renderPublications();
  }));

  const profileProbe = new Image();
  profileProbe.onload = () => {
    $("#profile-image").src = data.config.profileImage;
    $("#profile-image").hidden = false;
    $("#profile-image").classList.add("loaded");
    $("#profile-fallback").hidden = true;
  };
  profileProbe.onerror = () => {
    $("#profile-image").hidden = true;
    $("#profile-fallback").hidden = false;
  };
  profileProbe.src = data.config.profileImage;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      $$("#nav-links a").forEach((link) => {
        const active = link.dataset.section === entry.target.id;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-25% 0px -65% 0px" });
  navIds.forEach((id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });

  $("#year").textContent = new Date().getFullYear();
  applyTheme();
  renderAll();
})();
