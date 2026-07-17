(function () {
  "use strict";

  var AUTH_KEY = "hai_admin_unlocked";
  var PREVIEW_KEY = "hai_admin_preview";
  var STORAGE_KEY = "hai_site_content_local_v2";
  var params = new URLSearchParams(window.location.search);
  var wantsAdmin =
    params.get("admin") === "1" ||
    localStorage.getItem(PREVIEW_KEY) === "1" ||
    (window.location.hash || "").toLowerCase() === "#admin";
  var unlocked = localStorage.getItem(AUTH_KEY) === "1";

  if (!wantsAdmin) return;

  if (!unlocked) {
    window.location.href = "./admin.html";
    return;
  }

  // Keep admin mode sticky even if the host strips ?admin=1 from the URL.
  localStorage.setItem(PREVIEW_KEY, "1");

  var dataApi = window.HaiSiteData;
  var siteData = null;
  var rerender = null;
  var historyPast = [];
  var historyFuture = [];
  var lastSerialized = "";
  var applyingHistory = false;
  var HISTORY_MAX = 60;

  function loadSiteData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return dataApi.normalize(JSON.parse(raw));
    } catch (error) {}
    return dataApi.clone(dataApi.DEFAULT_SITE_DATA);
  }

  function updateUndoRedoButtons() {
    var undoBtn = document.querySelector("#admin-undo");
    var redoBtn = document.querySelector("#admin-redo");
    if (undoBtn) undoBtn.disabled = !historyPast.length;
    if (redoBtn) redoBtn.disabled = !historyFuture.length;
  }

  function rememberHistoryBeforeWrite() {
    if (applyingHistory) return;
    var next = JSON.stringify(siteData);
    if (!lastSerialized) {
      lastSerialized = next;
      return;
    }
    if (lastSerialized === next) return;
    try {
      historyPast.push(JSON.parse(lastSerialized));
    } catch (error) {
      historyPast.push(dataApi.clone(JSON.parse(lastSerialized)));
    }
    if (historyPast.length > HISTORY_MAX) historyPast.shift();
    historyFuture = [];
  }

  function saveSiteData() {
    siteData = dataApi.normalize(siteData);
    rememberHistoryBeforeWrite();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    lastSerialized = JSON.stringify(siteData);
    updateUndoRedoButtons();
  }

  function undoChange() {
    if (!historyPast.length) {
      toast("Nothing to undo.");
      return;
    }
    historyFuture.push(dataApi.clone(siteData));
    applyingHistory = true;
    siteData = dataApi.normalize(historyPast.pop());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    lastSerialized = JSON.stringify(siteData);
    applyingHistory = false;
    if (typeof rerender === "function") rerender(siteData);
    updateUndoRedoButtons();
    toast("Undo");
  }

  function redoChange() {
    if (!historyFuture.length) {
      toast("Nothing to redo.");
      return;
    }
    historyPast.push(dataApi.clone(siteData));
    applyingHistory = true;
    siteData = dataApi.normalize(historyFuture.pop());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
    lastSerialized = JSON.stringify(siteData);
    applyingHistory = false;
    if (typeof rerender === "function") rerender(siteData);
    updateUndoRedoButtons();
    toast("Redo");
  }

  function toast(message, isError) {
    var box = document.querySelector("#admin-live-toast");
    if (!box) return;
    box.textContent = message;
    box.style.color = isError ? "#ff8ea6" : "#9bd0ff";
  }

  function findSection(sectionId) {
    return (siteData.sections || []).find(function (section) {
      return section.id === sectionId;
    });
  }

  function refresh() {
    saveSiteData();
    if (typeof rerender === "function") {
      rerender(siteData);
    }
    toast("Saved.");
  }

  function readFileAsDataUrl(file, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function pickImageFile(callback) {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.addEventListener("change", function () {
      var file = input.files && input.files[0];
      if (!file) return;
      readFileAsDataUrl(file, callback);
    });
    input.click();
  }

  function addSection() {
    siteData.sections.push({
      id: dataApi.createId("section"),
      type: "custom",
      title: "New Section",
      description: "Click to edit this section.",
      enabled: true,
      items: [
        {
          title: "New Card",
          description: "Click to edit this card.",
          actionType: "link",
          actionLabel: "Open Link",
          url: "https://",
          videoUrl: "",
          imageUrl: ""
        }
      ]
    });
    refresh();
    toast("Section added.");
  }

  function deleteSection(sectionId) {
    var index = (siteData.sections || []).findIndex(function (section) {
      return section.id === sectionId;
    });
    if (index < 0) return;
    if (!window.confirm("Delete this section?")) return;
    siteData.sections.splice(index, 1);
    refresh();
    toast("Section deleted.");
  }

  function duplicateSection(sectionId) {
    var section = findSection(sectionId);
    if (!section) return;
    var copy = dataApi.clone(section);
    copy.id = dataApi.createId("section");
    copy.title = (section.title || "Section") + " (Copy)";
    var index = siteData.sections.findIndex(function (s) {
      return s.id === sectionId;
    });
    siteData.sections.splice(index + 1, 0, copy);
    refresh();
    toast("Section duplicated.");
  }

  function moveSection(sectionId, direction) {
    var index = siteData.sections.findIndex(function (s) {
      return s.id === sectionId;
    });
    if (index < 0) return;
    var next = index + direction;
    if (next < 0 || next >= siteData.sections.length) return;
    var temp = siteData.sections[index];
    siteData.sections[index] = siteData.sections[next];
    siteData.sections[next] = temp;
    refresh();
    toast("Section moved.");
  }

  function addItem(sectionId) {
    var section = findSection(sectionId);
    if (!section) return;
    if (!Array.isArray(section.items)) section.items = [];
    section.items.push({
      title: "New Card",
      description: "Click to edit this card.",
      actionType: "link",
      actionLabel: "Open Link",
      url: "https://",
      videoUrl: "",
      imageUrl: ""
    });
    refresh();
    toast("Card added.");
  }

  function deleteItem(sectionId, itemIndex) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.items || !section.items[idx]) return;
    if (!window.confirm("Delete this card?")) return;
    section.items.splice(idx, 1);
    refresh();
    toast("Card deleted.");
  }

  function duplicateItem(sectionId, itemIndex) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.items || !section.items[idx]) return;
    var copy = dataApi.clone(section.items[idx]);
    copy.title = (copy.title || "Card") + " (Copy)";
    section.items.splice(idx + 1, 0, copy);
    refresh();
    toast("Card duplicated.");
  }

  function moveItem(sectionId, itemIndex, direction) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.items || !section.items[idx]) return;
    var next = idx + direction;
    if (next < 0 || next >= section.items.length) return;
    var temp = section.items[idx];
    section.items[idx] = section.items[next];
    section.items[next] = temp;
    refresh();
    toast("Card moved.");
  }

  function moveInArray(list, fromIndex, toIndex) {
    if (!Array.isArray(list)) return false;
    var from = Number(fromIndex);
    var to = Number(toIndex);
    if (Number.isNaN(from) || Number.isNaN(to) || from < 0 || from >= list.length) return false;
    if (to < 0) to = 0;
    if (to > list.length) to = list.length;
    // insert mode: to is "before this index" in the list before removal
    if (to === from || to === from + 1) return false;
    var item = list.splice(from, 1)[0];
    if (to > from) to -= 1;
    list.splice(to, 0, item);
    return true;
  }

  function reorderList(payload) {
    var group = payload.group;
    var fromIndex = payload.fromIndex;
    var toIndex = payload.toIndex;
    var moved = false;

    if (group === "items") {
      var section = findSection(payload.sectionId);
      if (!section) return;
      moved = moveInArray(section.items, fromIndex, toIndex);
    } else if (group === "sections") {
      moved = moveInArray(siteData.sections, fromIndex, toIndex);
    } else if (group === "ctas") {
      moved = moveInArray(siteData.heroCtas, fromIndex, toIndex);
    } else if (group === "badges") {
      moved = moveInArray(siteData.badges, fromIndex, toIndex);
    } else if (group === "footer") {
      moved = moveInArray(siteData.footerLinks, fromIndex, toIndex);
    } else if (group === "social") {
      moved = moveInArray(siteData.socialLinks, fromIndex, toIndex);
    } else if (group === "footer-cols") {
      if (!Array.isArray(siteData.footerOrder) || !siteData.footerOrder.length) {
        siteData.footerOrder = ["brand", "links", "social"];
      }
      moved = moveInArray(siteData.footerOrder, fromIndex, toIndex);
    } else if (group === "section-btns") {
      var btnSection = findSection(payload.sectionId);
      if (!btnSection) return;
      if (!Array.isArray(btnSection.buttons)) btnSection.buttons = [];
      moved = moveInArray(btnSection.buttons, fromIndex, toIndex);
    }

    if (!moved) return;
    refresh();
    toast("Pasted in place.");
  }

  function sectionLinkOptions(selectedHref) {
    var options =
      '<option value="">Custom / other...</option>' +
      '<option value="#contact-form-section">#contact-form-section (Message form)</option>' +
      '<option value="#newsletter-section">#newsletter-section (Newsletter)</option>';
    (siteData.sections || []).forEach(function (section) {
      if (section.enabled === false) return;
      var value = "#" + section.id;
      var selected = selectedHref === value ? " selected" : "";
      options +=
        '<option value="' +
        value +
        '"' +
        selected +
        ">" +
        value +
        " — " +
        (section.title || section.id) +
        "</option>";
    });
    return options;
  }

  function cardLinkOptions(sectionId, selectedHref) {
    var section = findSection(sectionId);
    var options = '<option value="">Select a card...</option>';
    if (!section || !Array.isArray(section.items)) return options;
    section.items.forEach(function (item, index) {
      var value = "#" + section.id + "/card/" + index;
      var selected = selectedHref === value ? " selected" : "";
      var label = (item && item.title) || "Card " + (index + 1);
      options +=
        '<option value="' +
        value +
        '"' +
        selected +
        ">" +
        label +
        " (" +
        value +
        ")</option>";
    });
    return options;
  }

  function allCardsLinkOptions(selectedHref) {
    var options = '<option value="">Select a card from any section...</option>';
    (siteData.sections || []).forEach(function (section) {
      if (section.enabled === false || !Array.isArray(section.items)) return;
      section.items.forEach(function (item, index) {
        var value = "#" + section.id + "/card/" + index;
        var selected = selectedHref === value ? " selected" : "";
        var label = (item && item.title) || "Card " + (index + 1);
        options +=
          '<option value="' +
          value +
          '"' +
          selected +
          ">[" +
          (section.title || section.id) +
          "] " +
          label +
          " — " +
          value +
          "</option>";
      });
    });
    return options;
  }

  function sectionOnlyOptions(selectedHref) {
    var options = '<option value="">Select a section...</option>';
    options +=
      '<option value="#contact-form-section"' +
      (selectedHref === "#contact-form-section" ? " selected" : "") +
      ">Message form — #contact-form-section</option>";
    options +=
      '<option value="#newsletter-section"' +
      (selectedHref === "#newsletter-section" ? " selected" : "") +
      ">Newsletter — #newsletter-section</option>";
    (siteData.sections || []).forEach(function (section) {
      if (section.enabled === false) return;
      var value = "#" + section.id;
      var selected = selectedHref === value ? " selected" : "";
      options +=
        '<option value="' +
        value +
        '"' +
        selected +
        ">" +
        (section.title || section.id) +
        " — " +
        value +
        "</option>";
    });
    return options;
  }

  function parseCtaTarget(href) {
    var raw = String(href || "").trim();
    var cardMatch = raw.match(/^#([^/#\s]+)\/card\/(\d+)$/i);
    if (cardMatch) {
      return { type: "card", sectionId: cardMatch[1], cardIndex: Number(cardMatch[2]), href: raw };
    }
    if (raw.charAt(0) === "#") {
      var sid = raw.slice(1);
      var isSection =
        sid === "contact-form-section" ||
        sid === "newsletter-section" ||
        (siteData.sections || []).some(function (s) {
          return s.id === sid;
        });
      if (isSection) return { type: "section", sectionId: sid, href: raw };
    }
    return { type: "custom", href: raw || "#" };
  }

  function setCardImage(sectionId, itemIndex) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.items || !section.items[idx]) return;
    pickImageFile(function (dataUrl) {
      section.items[idx].imageUrl = dataUrl;
      if (!section.items[idx].actionType || section.items[idx].actionType === "none") {
        section.items[idx].actionType = "image";
        section.items[idx].actionLabel = "View Image";
      }
      refresh();
      toast("Card image updated.");
    });
  }

  function setSiteImage(kind) {
    pickImageFile(function (dataUrl) {
      if (kind === "logo") siteData.logoUrl = dataUrl;
      if (kind === "hero") siteData.heroImageUrl = dataUrl;
      refresh();
      toast(kind === "logo" ? "Logo updated." : "Main image updated.");
    });
  }

  function updateText(type, sectionId, itemIndex, value) {
    if (type === "company-name") {
      siteData.companyName = value;
      return true;
    }
    if (type === "tagline") {
      siteData.tagline = value;
      return true;
    }
    if (type === "rights-text") {
      if (!siteData.translations) siteData.translations = {};
      if (!siteData.translations.en) siteData.translations.en = {};
      if (!siteData.translations.en.ui) siteData.translations.en.ui = {};
      siteData.translations.en.ui.allRightsReserved = value;
      return true;
    }
    if (type === "contact-title") {
      siteData.contactBlock = siteData.contactBlock || {};
      siteData.contactBlock.title = value;
      return true;
    }
    if (type === "contact-description") {
      siteData.contactBlock = siteData.contactBlock || {};
      siteData.contactBlock.description = value;
      return true;
    }
    if (type === "contact-button") {
      siteData.contactBlock = siteData.contactBlock || {};
      siteData.contactBlock.buttonText = value;
      return true;
    }
    if (type === "news-title") {
      siteData.newsletterBlock = siteData.newsletterBlock || {};
      siteData.newsletterBlock.title = value;
      return true;
    }
    if (type === "news-description") {
      siteData.newsletterBlock = siteData.newsletterBlock || {};
      siteData.newsletterBlock.description = value;
      return true;
    }
    if (type === "news-button") {
      siteData.newsletterBlock = siteData.newsletterBlock || {};
      siteData.newsletterBlock.buttonText = value;
      return true;
    }
    if (type === "badge-text") {
      var bIdx = Number(itemIndex);
      if (!siteData.badges || !siteData.badges[bIdx]) return false;
      siteData.badges[bIdx].text = value;
      return true;
    }
    if (type === "cta-label") {
      var cIdx = Number(itemIndex);
      if (!siteData.heroCtas || !siteData.heroCtas[cIdx]) return false;
      siteData.heroCtas[cIdx].label = value;
      return true;
    }
    if (type === "section-btn-label") {
      var sBtnSection = findSection(sectionId);
      var sbIdx = Number(itemIndex);
      if (!sBtnSection || !sBtnSection.buttons || !sBtnSection.buttons[sbIdx]) return false;
      sBtnSection.buttons[sbIdx].label = value;
      return true;
    }
    if (type === "footer-label") {
      var fIdx = Number(itemIndex);
      if (!siteData.footerLinks || !siteData.footerLinks[fIdx]) return false;
      siteData.footerLinks[fIdx].label = value;
      return true;
    }
    if (type === "free-text") {
      if (!siteData.textOverrides || typeof siteData.textOverrides !== "object") {
        siteData.textOverrides = {};
      }
      var key = sectionId || "";
      if (!key) return false;
      siteData.textOverrides[key] = value;
      return true;
    }
    if (type === "social-label") {
      var sIdx = Number(itemIndex);
      if (!siteData.socialLinks || !siteData.socialLinks[sIdx]) return false;
      siteData.socialLinks[sIdx].label = value;
      return true;
    }
    if (type === "sidebar-title") {
      if (!siteData.translations) siteData.translations = {};
      if (!siteData.translations.en) siteData.translations.en = {};
      if (!siteData.translations.en.ui) siteData.translations.en.ui = {};
      siteData.translations.en.ui.sectionsMenu = value;
      return true;
    }
    if (type === "admin-link-text") {
      if (!siteData.translations) siteData.translations = {};
      if (!siteData.translations.en) siteData.translations.en = {};
      if (!siteData.translations.en.ui) siteData.translations.en.ui = {};
      siteData.translations.en.ui.adminPanel = value;
      return true;
    }

    var section = findSection(sectionId);
    if (!section) return false;

    if (type === "section-title") {
      section.title = value;
      return true;
    }
    if (type === "section-description") {
      section.description = value;
      return true;
    }

    var idx = Number(itemIndex);
    if (!section.items || !section.items[idx]) return false;
    var item = section.items[idx];

    if (type === "item-title") {
      item.title = value;
      return true;
    }
    if (type === "item-description") {
      item.description = value;
      return true;
    }
    if (type === "item-action-label") {
      item.actionLabel = value;
      return true;
    }
    return false;
  }

  function promptUrl(current) {
    return window.prompt("Enter URL", current || "https://");
  }

  function editCta(itemIndex) {
    var idx = Number(itemIndex);
    if (!siteData.heroCtas || !siteData.heroCtas[idx]) return;
    var cta = siteData.heroCtas[idx];
    var existing = document.querySelector("#cta-editor");
    if (existing) existing.remove();

    var target = parseCtaTarget(cta.href);
    var modal = document.createElement("div");
    modal.id = "cta-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel">' +
      "<h3>Edit Button</h3>" +
      '<div class="field"><label>Name</label><input id="cta-name" placeholder="Contact Us" /></div>' +
      '<div class="field"><label>Opens</label>' +
      '<select id="cta-target-type">' +
      '<option value="section">Any section</option>' +
      '<option value="card">Any card in any section</option>' +
      '<option value="custom">Custom link / URL</option>' +
      "</select></div>" +
      '<div class="field" id="cta-section-field"><label>Section (all sections)</label>' +
      '<select id="cta-section">' +
      sectionOnlyOptions(target.type === "section" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="cta-card-field"><label>Card (all sections)</label>' +
      '<select id="cta-card">' +
      allCardsLinkOptions(target.type === "card" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="cta-href-field"><label>Custom link</label>' +
      '<input id="cta-href" placeholder="#about or https://..." /></div>' +
      '<p class="section-description" style="margin:0 0 0.8rem;font-size:0.82rem">' +
      "Pick any section (e.g. Contact) or any card from any section. Card links look like #services/card/0." +
      "</p>" +
      '<div class="field"><label>Style</label>' +
      '<select id="cta-style"><option value="primary">Primary</option><option value="soft">Soft</option></select></div>' +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-primary" id="cta-save">Save</button>' +
      '<button type="button" class="btn-danger" id="cta-cancel">Cancel</button>' +
      "</div></div>";
    document.body.appendChild(modal);

    var typeSelect = modal.querySelector("#cta-target-type");
    var sectionSelect = modal.querySelector("#cta-section");
    var cardSelect = modal.querySelector("#cta-card");
    var hrefInput = modal.querySelector("#cta-href");

    modal.querySelector("#cta-name").value = cta.label || "";
    hrefInput.value = cta.href || "#";
    modal.querySelector("#cta-style").value = cta.style === "soft" ? "soft" : "primary";
    typeSelect.value = target.type === "card" || target.type === "section" || target.type === "custom"
      ? target.type
      : "section";

    function syncFields() {
      var type = typeSelect.value;
      modal.querySelector("#cta-section-field").style.display = type === "section" ? "" : "none";
      modal.querySelector("#cta-card-field").style.display = type === "card" ? "" : "none";
      modal.querySelector("#cta-href-field").style.display = type === "custom" ? "" : "none";
      if (type === "section" && sectionSelect.value) hrefInput.value = sectionSelect.value;
      if (type === "card" && cardSelect.value) hrefInput.value = cardSelect.value;
    }
    syncFields();

    typeSelect.addEventListener("change", syncFields);
    sectionSelect.addEventListener("change", function () {
      if (sectionSelect.value) hrefInput.value = sectionSelect.value;
    });
    cardSelect.addEventListener("change", function () {
      if (cardSelect.value) hrefInput.value = cardSelect.value;
    });

    modal.querySelector(".card-link-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#cta-cancel").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#cta-save").addEventListener("click", function () {
      var name = modal.querySelector("#cta-name").value.trim() || "Button";
      var type = typeSelect.value;
      var href = "#";
      if (type === "section") {
        href = sectionSelect.value || "#";
        if (!href || href === "#") {
          toast("Pick a section.", true);
          return;
        }
      } else if (type === "card") {
        href = cardSelect.value || "#";
        if (!href || href === "#") {
          toast("Pick a card.", true);
          return;
        }
      } else {
        href = hrefInput.value.trim() || "#";
        if (href.charAt(0) !== "#" && href.indexOf("http") !== 0 && href.indexOf("mailto:") !== 0) {
          href = "#" + href.replace(/^#/, "");
        }
      }
      cta.label = name;
      cta.href = href;
      cta.style = modal.querySelector("#cta-style").value === "soft" ? "soft" : "primary";
      modal.remove();
      refresh();
      toast("Button saved.");
    });
  }

  function editFooterLink(itemIndex) {
    var idx = Number(itemIndex);
    if (!siteData.footerLinks || !siteData.footerLinks[idx]) return;
    var link = siteData.footerLinks[idx];
    var existing = document.querySelector("#footer-link-editor");
    if (existing) existing.remove();

    var target = parseCtaTarget(link.href);
    var modal = document.createElement("div");
    modal.id = "footer-link-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel">' +
      "<h3>Edit Footer Link</h3>" +
      '<div class="field"><label>Name</label><input id="flink-name" placeholder="About Us" /></div>' +
      '<div class="field"><label>Opens</label>' +
      '<select id="flink-target-type">' +
      '<option value="section">Any section</option>' +
      '<option value="card">Any card in any section</option>' +
      '<option value="custom">Custom link / URL</option>' +
      "</select></div>" +
      '<div class="field" id="flink-section-field"><label>Section (all sections)</label>' +
      '<select id="flink-section">' +
      sectionOnlyOptions(target.type === "section" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="flink-card-field"><label>Card (all sections)</label>' +
      '<select id="flink-card">' +
      allCardsLinkOptions(target.type === "card" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="flink-href-field"><label>Custom link</label>' +
      '<input id="flink-href" placeholder="#about" /></div>' +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-primary" id="flink-save">Save</button>' +
      '<button type="button" class="btn-danger" id="flink-cancel">Cancel</button>' +
      "</div></div>";
    document.body.appendChild(modal);

    var typeSelect = modal.querySelector("#flink-target-type");
    var sectionSelect = modal.querySelector("#flink-section");
    var cardSelect = modal.querySelector("#flink-card");
    var hrefInput = modal.querySelector("#flink-href");

    modal.querySelector("#flink-name").value = link.label || "";
    hrefInput.value = link.href || "#";
    typeSelect.value =
      target.type === "card" || target.type === "section" || target.type === "custom"
        ? target.type
        : "section";

    function syncFields() {
      var type = typeSelect.value;
      modal.querySelector("#flink-section-field").style.display = type === "section" ? "" : "none";
      modal.querySelector("#flink-card-field").style.display = type === "card" ? "" : "none";
      modal.querySelector("#flink-href-field").style.display = type === "custom" ? "" : "none";
      if (type === "section" && sectionSelect.value) hrefInput.value = sectionSelect.value;
      if (type === "card" && cardSelect.value) hrefInput.value = cardSelect.value;
    }
    syncFields();

    typeSelect.addEventListener("change", syncFields);
    sectionSelect.addEventListener("change", function () {
      if (sectionSelect.value) hrefInput.value = sectionSelect.value;
    });
    cardSelect.addEventListener("change", function () {
      if (cardSelect.value) hrefInput.value = cardSelect.value;
    });
    modal.querySelector(".card-link-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#flink-cancel").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#flink-save").addEventListener("click", function () {
      var type = typeSelect.value;
      var href = "#";
      if (type === "section") href = sectionSelect.value || "#";
      else if (type === "card") href = cardSelect.value || "#";
      else {
        href = hrefInput.value.trim() || "#";
        if (href.charAt(0) !== "#" && href.indexOf("http") !== 0 && href.indexOf("mailto:") !== 0) {
          href = "#" + href.replace(/^#/, "");
        }
      }
      if ((type === "section" || type === "card") && (!href || href === "#")) {
        toast(type === "section" ? "Pick a section." : "Pick a card.", true);
        return;
      }
      link.label = modal.querySelector("#flink-name").value.trim() || "Link";
      link.href = href;
      modal.remove();
      refresh();
      toast("Footer link saved.");
    });
  }

  function openSocialEditor(itemIndex) {
    var isNew = itemIndex == null;
    var social = isNew
      ? { id: dataApi.createId("social"), platform: "youtube", label: "YouTube", url: "https://", enabled: true }
      : siteData.socialLinks[Number(itemIndex)];
    if (!social) return;

    var existing = document.querySelector("#social-editor");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id = "social-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel">' +
      "<h3>Social Icon</h3>" +
      '<div class="field"><label>Platform</label>' +
      '<select id="social-platform">' +
      '<option value="youtube">YouTube</option>' +
      '<option value="instagram">Instagram</option>' +
      '<option value="facebook">Facebook</option>' +
      '<option value="custom">Custom</option>' +
      "</select></div>" +
      '<div class="field"><label>Label</label><input id="social-label" /></div>' +
      '<div class="field"><label>Link URL</label><input id="social-url" placeholder="https://..." /></div>' +
      '<div class="field"><label>Enabled</label>' +
      '<select id="social-enabled"><option value="true">Yes</option><option value="false">No</option></select></div>' +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-primary" id="social-save">Save</button>' +
      '<button type="button" class="btn-danger" id="social-cancel">Cancel</button>' +
      "</div></div>";
    document.body.appendChild(modal);

    modal.querySelector("#social-platform").value = social.platform || "youtube";
    modal.querySelector("#social-label").value = social.label || "";
    modal.querySelector("#social-url").value = social.url || "";
    modal.querySelector("#social-enabled").value = social.enabled === false ? "false" : "true";

    modal.querySelector(".card-link-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#social-cancel").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#social-save").addEventListener("click", function () {
      social.platform = modal.querySelector("#social-platform").value;
      social.label = modal.querySelector("#social-label").value.trim() || social.platform;
      social.url = modal.querySelector("#social-url").value.trim();
      social.enabled = modal.querySelector("#social-enabled").value === "true";
      if (isNew) {
        if (!Array.isArray(siteData.socialLinks)) siteData.socialLinks = [];
        siteData.socialLinks.push(social);
      }
      modal.remove();
      refresh();
      toast("Social icon saved.");
    });
  }

  function closeLinkEditor() {
    var modal = document.querySelector("#card-link-editor");
    if (modal) modal.remove();
  }

  function openLinkEditor(sectionId, itemIndex) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.items || !section.items[idx]) return;
    var item = section.items[idx];
    closeLinkEditor();

    var target = parseCtaTarget(item.url);
    var actionType = item.actionType || "link";
    if (actionType === "link" && target.type === "section") actionType = "section";
    if (actionType === "link" && target.type === "card") actionType = "card";

    var modal = document.createElement("div");
    modal.id = "card-link-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel">' +
      "<h3>Edit Card Link / Media</h3>" +
      '<div class="field"><label>Action Type</label>' +
      '<select id="card-action-type">' +
      '<option value="none">Text only</option>' +
      '<option value="section">Open any section</option>' +
      '<option value="card">Open any card in any section</option>' +
      '<option value="link">Open external link</option>' +
      '<option value="video">Open Video</option>' +
      '<option value="image">Open Image</option>' +
      "</select></div>" +
      '<div class="field"><label>Button Text</label><input id="card-action-label" /></div>' +
      '<div class="field"><label>Button Style</label>' +
      '<select id="card-action-style"><option value="primary">Primary</option><option value="soft">Soft</option></select></div>' +
      '<div class="field" id="card-section-field"><label>Section (all sections)</label>' +
      '<select id="card-section-target">' +
      sectionOnlyOptions(target.type === "section" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="card-card-field"><label>Card (all sections)</label>' +
      '<select id="card-card-target">' +
      allCardsLinkOptions(target.type === "card" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="card-url-field"><label>Link URL</label><input id="card-url" placeholder="https://..." /></div>' +
      '<div class="field" id="card-video-field"><label>Video URL</label><input id="card-video" placeholder="YouTube URL" /></div>' +
      '<div class="field" id="card-image-field"><label>Image URL</label><input id="card-image" placeholder="https://image..." /></div>' +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-soft" id="card-upload-image">Upload Image File</button>' +
      '<button type="button" class="btn-primary" id="card-link-save">Save</button>' +
      '<button type="button" class="btn-danger" id="card-link-cancel">Cancel</button>' +
      "</div></div>";

    document.body.appendChild(modal);

    var typeSelect = modal.querySelector("#card-action-type");
    typeSelect.value = actionType;
    modal.querySelector("#card-action-label").value = item.actionLabel || "Open";
    modal.querySelector("#card-action-style").value =
      item.actionStyle === "soft" ? "soft" : "primary";
    modal.querySelector("#card-url").value = item.url || "";
    modal.querySelector("#card-video").value = item.videoUrl || "";
    modal.querySelector("#card-image").value = item.imageUrl || "";

    function syncCardFields() {
      var type = typeSelect.value;
      modal.querySelector("#card-section-field").style.display = type === "section" ? "" : "none";
      modal.querySelector("#card-card-field").style.display = type === "card" ? "" : "none";
      modal.querySelector("#card-url-field").style.display = type === "link" ? "" : "none";
      modal.querySelector("#card-video-field").style.display = type === "video" ? "" : "none";
      modal.querySelector("#card-image-field").style.display = type === "image" ? "" : "none";
      modal.querySelector("#card-upload-image").style.display = type === "image" ? "" : "none";
      modal.querySelector("#card-action-style").parentElement.style.display =
        type === "none" ? "none" : "";
    }
    syncCardFields();
    typeSelect.addEventListener("change", syncCardFields);

    modal.querySelector(".card-link-backdrop").addEventListener("click", closeLinkEditor);
    modal.querySelector("#card-link-cancel").addEventListener("click", closeLinkEditor);
    modal.querySelector("#card-upload-image").addEventListener("click", function () {
      pickImageFile(function (dataUrl) {
        modal.querySelector("#card-image").value = dataUrl;
        typeSelect.value = "image";
        syncCardFields();
      });
    });
    modal.querySelector("#card-link-save").addEventListener("click", function () {
      var type = typeSelect.value;
      item.actionType = type;
      item.actionLabel = modal.querySelector("#card-action-label").value.trim() || "Open";
      item.actionStyle =
        modal.querySelector("#card-action-style").value === "soft" ? "soft" : "primary";
      item.videoUrl = modal.querySelector("#card-video").value.trim();
      item.imageUrl = modal.querySelector("#card-image").value.trim();
      if (type === "none") {
        item.actionLabel = "";
      } else if (type === "section") {
        item.url = modal.querySelector("#card-section-target").value || "#";
      } else if (type === "card") {
        item.url = modal.querySelector("#card-card-target").value || "#";
      } else {
        item.url = modal.querySelector("#card-url").value.trim();
      }
      closeLinkEditor();
      refresh();
      toast("Card link saved.");
    });
  }

  function editSectionBtn(sectionId, itemIndex) {
    var section = findSection(sectionId);
    var idx = Number(itemIndex);
    if (!section || !section.buttons || !section.buttons[idx]) return;
    var btn = section.buttons[idx];
    var existing = document.querySelector("#section-btn-editor");
    if (existing) existing.remove();

    var target = parseCtaTarget(btn.href);
    var modal = document.createElement("div");
    modal.id = "section-btn-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel">' +
      "<h3>Section Button</h3>" +
      '<div class="field"><label>Name</label><input id="sbtn-name" placeholder="Contact Us" /></div>' +
      '<div class="field"><label>Opens</label>' +
      '<select id="sbtn-target-type">' +
      '<option value="section">Any section</option>' +
      '<option value="card">Any card in any section</option>' +
      '<option value="custom">Custom link / URL</option>' +
      "</select></div>" +
      '<div class="field" id="sbtn-section-field"><label>Section</label>' +
      '<select id="sbtn-section">' +
      sectionOnlyOptions(target.type === "section" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="sbtn-card-field"><label>Card</label>' +
      '<select id="sbtn-card">' +
      allCardsLinkOptions(target.type === "card" ? target.href : "") +
      "</select></div>" +
      '<div class="field" id="sbtn-href-field"><label>Custom link</label>' +
      '<input id="sbtn-href" /></div>' +
      '<div class="field"><label>Style</label>' +
      '<select id="sbtn-style"><option value="primary">Primary</option><option value="soft">Soft</option></select></div>' +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-primary" id="sbtn-save">Save</button>' +
      '<button type="button" class="btn-danger" id="sbtn-cancel">Cancel</button>' +
      "</div></div>";
    document.body.appendChild(modal);

    var typeSelect = modal.querySelector("#sbtn-target-type");
    var sectionSelect = modal.querySelector("#sbtn-section");
    var cardSelect = modal.querySelector("#sbtn-card");
    var hrefInput = modal.querySelector("#sbtn-href");
    modal.querySelector("#sbtn-name").value = btn.label || "";
    hrefInput.value = btn.href || "#";
    modal.querySelector("#sbtn-style").value = btn.style === "soft" ? "soft" : "primary";
    typeSelect.value =
      target.type === "card" || target.type === "section" || target.type === "custom"
        ? target.type
        : "section";

    function syncFields() {
      var type = typeSelect.value;
      modal.querySelector("#sbtn-section-field").style.display = type === "section" ? "" : "none";
      modal.querySelector("#sbtn-card-field").style.display = type === "card" ? "" : "none";
      modal.querySelector("#sbtn-href-field").style.display = type === "custom" ? "" : "none";
      if (type === "section" && sectionSelect.value) hrefInput.value = sectionSelect.value;
      if (type === "card" && cardSelect.value) hrefInput.value = cardSelect.value;
    }
    syncFields();
    typeSelect.addEventListener("change", syncFields);
    sectionSelect.addEventListener("change", function () {
      if (sectionSelect.value) hrefInput.value = sectionSelect.value;
    });
    cardSelect.addEventListener("change", function () {
      if (cardSelect.value) hrefInput.value = cardSelect.value;
    });
    modal.querySelector(".card-link-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#sbtn-cancel").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#sbtn-save").addEventListener("click", function () {
      var type = typeSelect.value;
      var href = "#";
      if (type === "section") href = sectionSelect.value || "#";
      else if (type === "card") href = cardSelect.value || "#";
      else href = hrefInput.value.trim() || "#";
      if ((type === "section" || type === "card") && href === "#") {
        toast("Pick a target.", true);
        return;
      }
      btn.label = modal.querySelector("#sbtn-name").value.trim() || "Button";
      btn.href = href;
      btn.style = modal.querySelector("#sbtn-style").value === "soft" ? "soft" : "primary";
      modal.remove();
      refresh();
      toast("Section button saved.");
    });
  }

  function openSiteSettings() {
    var existing = document.querySelector("#site-settings-editor");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.id = "site-settings-editor";
    modal.className = "card-link-editor";
    modal.innerHTML =
      '<div class="card-link-backdrop"></div>' +
      '<div class="card-link-panel" style="max-height:85vh;overflow:auto">' +
      "<h3>Site Settings</h3>" +
      '<div class="field"><label>Company Name</label><input id="set-company" /></div>' +
      '<div class="field"><label>Tagline</label><textarea id="set-tagline"></textarea></div>' +
      '<div class="field"><label>Primary Color</label><input id="set-color" placeholder="#1e72ff" /></div>' +
      '<div class="field"><label>Default Language</label>' +
      '<select id="set-lang"><option value="en">English</option><option value="ar">Arabic</option></select></div>' +
      "<h3>Website Server</h3>" +
      '<div class="field"><label>Choose action</label>' +
      '<select id="set-web-action">' +
      '<option value="">— Select —</option>' +
      '<option value="run">Run Web</option>' +
      '<option value="stop">Stop Web</option>' +
      "</select></div>" +
      '<div class="mini-actions" style="margin-bottom:0.8rem">' +
      '<button type="button" class="btn-primary" id="set-web-apply">Apply</button>' +
      "</div>" +
      '<p class="section-description" id="set-web-status">' +
      "First time: double-click <strong>run-web.bat</strong> once (keeps control running). Then use this menu anytime." +
      "</p>" +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-soft" id="set-logo">Change Logo</button>' +
      '<button type="button" class="btn-soft" id="set-hero">Change Main Image</button>' +
      '<button type="button" class="btn-primary" id="set-save">Save</button>' +
      '<button type="button" class="btn-danger" id="set-cancel">Close</button>' +
      "</div></div>";
    document.body.appendChild(modal);

    modal.querySelector("#set-company").value = siteData.companyName || "";
    modal.querySelector("#set-tagline").value = siteData.tagline || "";
    modal.querySelector("#set-color").value = siteData.primaryColor || "#1e72ff";
    modal.querySelector("#set-lang").value = siteData.defaultLanguage || "en";

    var statusEl = modal.querySelector("#set-web-status");

    function callWebControl(action) {
      statusEl.textContent = action === "run" ? "Starting website..." : "Stopping website...";
      return fetch("http://127.0.0.1:5501/" + action, { method: "POST" })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          statusEl.textContent = (data && data.message) || (action === "run" ? "Website running." : "Website stopped.");
          toast(statusEl.textContent);
          if (action === "run") {
            window.setTimeout(function () {
              window.open("http://localhost:5500", "_blank");
            }, 700);
          }
        })
        .catch(function () {
          statusEl.textContent =
            "Control is not running. Double-click run-web.bat in the HAI WEB folder first, then try again.";
          toast("Start run-web.bat first.", true);
        });
    }

    modal.querySelector("#set-web-apply").addEventListener("click", function () {
      var action = modal.querySelector("#set-web-action").value;
      if (action !== "run" && action !== "stop") {
        statusEl.textContent = "Choose Run Web or Stop Web first.";
        return;
      }
      callWebControl(action);
    });

    modal.querySelector(".card-link-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#set-cancel").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector("#set-logo").addEventListener("click", function () {
      setSiteImage("logo");
    });
    modal.querySelector("#set-hero").addEventListener("click", function () {
      setSiteImage("hero");
    });
    modal.querySelector("#set-save").addEventListener("click", function () {
      siteData.companyName = modal.querySelector("#set-company").value.trim() || siteData.companyName;
      siteData.tagline = modal.querySelector("#set-tagline").value.trim();
      siteData.primaryColor = modal.querySelector("#set-color").value.trim() || "#1e72ff";
      siteData.defaultLanguage = modal.querySelector("#set-lang").value;
      modal.remove();
      refresh();
      toast("Settings saved.");
    });
  }

  function buildFreeTextKey(el) {
    if (el.getAttribute("data-free-text")) return el.getAttribute("data-free-text");
    if (el.id) return "id:" + el.id;
    var parts = [];
    var node = el;
    var depth = 0;
    while (node && node.nodeType === 1 && node !== document.body && depth < 12) {
      var name = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift("#" + node.id);
        break;
      }
      var parent = node.parentElement;
      if (parent) {
        var same = Array.prototype.filter.call(parent.children, function (child) {
          return child.tagName === node.tagName;
        });
        var idx = same.indexOf(node);
        parts.unshift(name + (same.length > 1 ? "[" + idx + "]" : ""));
      } else {
        parts.unshift(name);
      }
      node = parent;
      depth += 1;
    }
    return parts.join("/");
  }

  function isEditableTextTarget(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest(".admin-live-bar, .hover-toolbar, .hover-btn, .drag-handle, .drop-slot, .card-link-editor, .card-action-del, .media-modal, script, style, noscript")) {
      return false;
    }
    if (el.closest("input, textarea, select, option")) return false;
    if (el.matches("input, textarea, select, option, img, svg, path, button.hover-btn, .drag-handle")) {
      return false;
    }
    var tag = el.tagName.toLowerCase();
    if (tag === "button" && (el.classList.contains("hover-btn") || el.classList.contains("add-inline-btn") || el.classList.contains("card-action-del"))) {
      return false;
    }
    return true;
  }

  function enableInlineTextEditing() {
    document.body.classList.add("admin-inline-mode");

    var selector =
      "h1, h2, h3, h4, h5, h6, p, label, span, a, li, " +
      "[data-company-name], [data-tagline], [data-rights], [data-sidebar-title], [data-admin-link], " +
      "[data-contact-title], [data-contact-desc], [data-contact-button], " +
      "[data-news-title], [data-news-desc], [data-news-button], " +
      ".brand-name, .sidebar-title, .hero-cta, .section-cta, .card-action, .social-icon, .badge-chip";

    document.querySelectorAll(selector).forEach(function (el) {
      if (!isEditableTextTarget(el)) return;
      // Don't nest editable hosts inside other marked text fields
      if (!el.getAttribute("data-inline-edit") && el.querySelector("[data-inline-edit], [data-free-text]")) {
        return;
      }
      if (el.matches("div, section, article, nav, main, header, footer, form, ul, ol")) return;
      if (el.children.length && !el.matches("a, label, .badge-chip, .hero-cta, .section-cta, .card-action, .social-icon, button")) {
        // allow if it has direct text
        var hasDirectText = Array.prototype.some.call(el.childNodes, function (n) {
          return n.nodeType === 3 && (n.textContent || "").trim();
        });
        if (!hasDirectText) return;
      }

      if (!el.getAttribute("data-inline-edit") && !el.getAttribute("data-free-text")) {
        el.setAttribute("data-free-text", buildFreeTextKey(el));
      }

      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "true");
      el.classList.add("inline-editable");
    });

    document.querySelectorAll("[data-inline-edit]").forEach(function (el) {
      if (!isEditableTextTarget(el)) return;
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "true");
      el.classList.add("inline-editable");
    });

    if (document.body.dataset.adminTextWired === "1") return;
    document.body.dataset.adminTextWired = "1";

    document.addEventListener("click", function (event) {
      var el = event.target.closest("[contenteditable='true']");
      if (!el || !isEditableTextTarget(el)) return;
      if (el.tagName.toLowerCase() === "a") event.preventDefault();
    });

    document.addEventListener("keydown", function (event) {
      var el = event.target.closest("[contenteditable='true']");
      if (!el || !isEditableTextTarget(el)) return;
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        el.blur();
      }
    });

    document.addEventListener("focusout", function (event) {
      var el = event.target.closest("[contenteditable='true']");
      if (!el || !isEditableTextTarget(el)) return;
      var value = (el.textContent || "").trim();
      var inline = el.getAttribute("data-inline-edit");
      var ok = false;

      if (inline) {
        ok = updateText(
          inline,
          el.getAttribute("data-section-id") || "",
          el.getAttribute("data-item-index") || "",
          value
        );
      } else {
        var key = el.getAttribute("data-free-text") || buildFreeTextKey(el);
        el.setAttribute("data-free-text", key);
        ok = updateText("free-text", key, "", value);
      }

      if (!ok) {
        toast("Could not update text.", true);
        return;
      }
      saveSiteData();
      toast("Text updated.");
    });

    // Re-apply saved free text after keys are attached
    if (siteData && siteData.textOverrides) {
      Object.keys(siteData.textOverrides).forEach(function (key) {
        var el = document.querySelector('[data-free-text="' + key + '"]');
        if (el) el.textContent = siteData.textOverrides[key];
      });
    }
  }

  function wireImageClickTargets() {
    var logo = document.querySelector("[data-logo]");
    if (logo) {
      logo.classList.add("editable-image");
      logo.title = "Click to change logo";
      logo.onclick = function () {
        setSiteImage("logo");
      };
    }
    var hero = document.querySelector("[data-hero-image]");
    if (hero) {
      hero.classList.add("editable-image");
      hero.title = "Click to change main image";
      hero.onclick = function () {
        setSiteImage("hero");
      };
    }
  }

  function buildToolbar() {
    var existing = document.querySelector("#admin-live-bar");
    if (existing) existing.remove();

    var bar = document.createElement("div");
    bar.id = "admin-live-bar";
    bar.className = "admin-live-bar";
    bar.innerHTML =
      '<div class="admin-live-left">' +
      "<strong>Admin Edit Mode</strong>" +
      '<span id="admin-live-toast">Click any text to edit. Drag ⋮⋮ to reorder. Save when done.</span>' +
      "</div>" +
      '<div class="mini-actions">' +
      '<button type="button" class="btn-soft admin-history-btn" id="admin-undo" title="Undo (Ctrl+Z)">← Undo</button>' +
      '<button type="button" class="btn-soft admin-history-btn" id="admin-redo" title="Redo (Ctrl+Y)">Redo →</button>' +
      '<button type="button" class="btn-soft" id="admin-add-button">+ Button</button>' +
      '<button type="button" class="btn-soft" id="admin-add-section">Add Section</button>' +
      '<button type="button" class="btn-soft" id="admin-settings">Settings</button>' +
      '<button type="button" class="btn-soft" id="admin-change-logo">Logo</button>' +
      '<button type="button" class="btn-soft" id="admin-change-hero">Main Image</button>' +
      '<button type="button" class="btn-soft" id="admin-social">Social Icons</button>' +
      '<button type="button" class="btn-primary" id="admin-save">Save</button>' +
      '<button type="button" class="btn-danger" id="admin-lock">Lock</button>' +
      "</div>";
    document.body.appendChild(bar);

    document.querySelector("#admin-undo").addEventListener("click", undoChange);
    document.querySelector("#admin-redo").addEventListener("click", redoChange);
    document.querySelector("#admin-add-button").addEventListener("click", function () {
      window.HaiAdminLive.handleAction({ action: "add-cta" });
    });
    document.querySelector("#admin-add-section").addEventListener("click", addSection);
    document.querySelector("#admin-settings").addEventListener("click", openSiteSettings);
    document.querySelector("#admin-change-logo").addEventListener("click", function () {
      setSiteImage("logo");
    });
    document.querySelector("#admin-change-hero").addEventListener("click", function () {
      setSiteImage("hero");
    });
    document.querySelector("#admin-social").addEventListener("click", function () {
      openSocialEditor(null);
    });
    document.querySelector("#admin-save").addEventListener("click", function () {
      saveSiteData();
      toast("Saved.");
    });
    document.querySelector("#admin-lock").addEventListener("click", function () {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(PREVIEW_KEY);
      window.location.href = "./admin.html";
    });
    updateUndoRedoButtons();
  }

  window.HaiAdminLive = {
    isActive: true,
    getData: function () {
      return siteData;
    },
    onReady: function (initialData, renderFn) {
      siteData = dataApi.normalize(initialData || loadSiteData());
      lastSerialized = JSON.stringify(siteData);
      historyPast = [];
      historyFuture = [];
      rerender = renderFn;
      document.body.classList.add("admin-inline-mode");
      buildToolbar();
      enableInlineTextEditing();
      wireImageClickTargets();
      if (!document.body.dataset.adminHistoryKeys) {
        document.body.dataset.adminHistoryKeys = "1";
        document.addEventListener("keydown", function (event) {
          var tag = (event.target && event.target.tagName) || "";
          if (tag === "INPUT" || tag === "TEXTAREA" || event.target.isContentEditable) return;
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !event.shiftKey) {
            event.preventDefault();
            undoChange();
          }
          if (
            (event.ctrlKey || event.metaKey) &&
            (event.key.toLowerCase() === "y" || (event.key.toLowerCase() === "z" && event.shiftKey))
          ) {
            event.preventDefault();
            redoChange();
          }
        });
      }
    },
    onRendered: function () {
      enableInlineTextEditing();
      wireImageClickTargets();
    },
    handleAction: function (payload) {
      if (!payload) return;
      if (payload.action === "add-section") addSection();
      if (payload.action === "delete-section") deleteSection(payload.sectionId);
      if (payload.action === "duplicate-section") duplicateSection(payload.sectionId);
      if (payload.action === "move-section-up") moveSection(payload.sectionId, -1);
      if (payload.action === "move-section-down") moveSection(payload.sectionId, 1);
      if (payload.action === "add-item") addItem(payload.sectionId);
      if (payload.action === "delete-item") deleteItem(payload.sectionId, payload.itemIndex);
      if (payload.action === "duplicate-item") duplicateItem(payload.sectionId, payload.itemIndex);
      if (payload.action === "move-item-up") moveItem(payload.sectionId, payload.itemIndex, -1);
      if (payload.action === "move-item-down") moveItem(payload.sectionId, payload.itemIndex, 1);
      if (payload.action === "reorder") reorderList(payload);
      if (payload.action === "edit-link") openLinkEditor(payload.sectionId, payload.itemIndex);
      if (payload.action === "add-card-btn") {
        var cardSec = findSection(payload.sectionId);
        var cardIdx = Number(payload.itemIndex);
        if (!cardSec || !cardSec.items || !cardSec.items[cardIdx]) return;
        var cardItem = cardSec.items[cardIdx];
        if (!cardItem.actionType || cardItem.actionType === "none") {
          cardItem.actionType = "section";
          cardItem.actionLabel = "Open";
          var firstOpen = (siteData.sections || []).find(function (s) {
            return s.enabled !== false;
          });
          cardItem.url = firstOpen ? "#" + firstOpen.id : "#about";
          cardItem.actionStyle = "primary";
        }
        refresh();
        openLinkEditor(payload.sectionId, payload.itemIndex);
      }
      if (payload.action === "remove-card-btn") {
        var remSec = findSection(payload.sectionId);
        var remIdx = Number(payload.itemIndex);
        if (!remSec || !remSec.items || !remSec.items[remIdx]) return;
        remSec.items[remIdx].actionType = "none";
        remSec.items[remIdx].actionLabel = "";
        refresh();
        toast("Card button removed.");
      }
      if (payload.action === "set-card-image") setCardImage(payload.sectionId, payload.itemIndex);
      if (payload.action === "set-section-image") {
        var secImg = findSection(payload.sectionId);
        if (!secImg) return;
        pickImageFile(function (dataUrl) {
          secImg.imageUrl = dataUrl;
          refresh();
          toast("Section image updated.");
        });
      }
      if (payload.action === "add-section-btn") {
        var secBtnHost = findSection(payload.sectionId);
        if (!secBtnHost) return;
        if (!Array.isArray(secBtnHost.buttons)) secBtnHost.buttons = [];
        var firstOpen = (siteData.sections || []).find(function (s) {
          return s.enabled !== false;
        });
        secBtnHost.buttons.push({
          id: dataApi.createId("sbtn"),
          label: "New Button",
          href: firstOpen ? "#" + firstOpen.id : "#about",
          style: "primary"
        });
        refresh();
        editSectionBtn(payload.sectionId, secBtnHost.buttons.length - 1);
      }
      if (payload.action === "edit-section-btn") {
        editSectionBtn(payload.sectionId, payload.itemIndex);
      }
      if (payload.action === "delete-section-btn") {
        var secDel = findSection(payload.sectionId);
        if (!secDel || !secDel.buttons) return;
        secDel.buttons.splice(Number(payload.itemIndex), 1);
        refresh();
      }
      if (payload.action === "set-logo") setSiteImage("logo");
      if (payload.action === "set-hero") setSiteImage("hero");

      if (payload.action === "add-badge") {
        if (!Array.isArray(siteData.badges)) siteData.badges = [];
        siteData.badges.push({ id: dataApi.createId("badge"), text: "New" });
        refresh();
      }
      if (payload.action === "delete-badge") {
        if (!siteData.badges) return;
        siteData.badges.splice(Number(payload.itemIndex), 1);
        refresh();
      }
      if (payload.action === "add-cta") {
        if (!Array.isArray(siteData.heroCtas)) siteData.heroCtas = [];
        var firstSection = (siteData.sections || []).find(function (s) {
          return s.enabled !== false;
        });
        siteData.heroCtas.push({
          id: dataApi.createId("cta"),
          label: "New Button",
          href: firstSection ? "#" + firstSection.id : "#about",
          style: "primary"
        });
        refresh();
        editCta(siteData.heroCtas.length - 1);
      }
      if (payload.action === "delete-cta") {
        if (!siteData.heroCtas) return;
        siteData.heroCtas.splice(Number(payload.itemIndex), 1);
        refresh();
      }
      if (payload.action === "edit-cta") editCta(payload.itemIndex);
      if (payload.action === "add-footer-link") {
        if (!Array.isArray(siteData.footerLinks)) siteData.footerLinks = [];
        var firstSec = (siteData.sections || []).find(function (s) {
          return s.enabled !== false;
        });
        siteData.footerLinks.push({
          id: dataApi.createId("flink"),
          label: "New Link",
          href: firstSec ? "#" + firstSec.id : "#about"
        });
        refresh();
        editFooterLink(siteData.footerLinks.length - 1);
      }
      if (payload.action === "delete-footer-link") {
        if (!siteData.footerLinks) return;
        siteData.footerLinks.splice(Number(payload.itemIndex), 1);
        refresh();
      }
      if (payload.action === "edit-footer-link") editFooterLink(payload.itemIndex);
      if (payload.action === "add-social") openSocialEditor(null);
      if (payload.action === "edit-social") openSocialEditor(payload.itemIndex);
      if (payload.action === "delete-social") {
        if (!siteData.socialLinks) return;
        if (!window.confirm("Delete this social icon?")) return;
        siteData.socialLinks.splice(Number(payload.itemIndex), 1);
        refresh();
      }
      if (payload.action === "toggle-contact") {
        siteData.contactBlock = siteData.contactBlock || {};
        siteData.contactBlock.enabled = siteData.contactBlock.enabled === false;
        refresh();
      }
      if (payload.action === "delete-contact") {
        if (!window.confirm("Hide/delete contact section?")) return;
        siteData.contactBlock = siteData.contactBlock || {};
        siteData.contactBlock.enabled = false;
        refresh();
      }
      if (payload.action === "toggle-newsletter") {
        siteData.newsletterBlock = siteData.newsletterBlock || {};
        siteData.newsletterBlock.enabled = siteData.newsletterBlock.enabled === false;
        refresh();
      }
      if (payload.action === "delete-newsletter") {
        if (!window.confirm("Hide/delete newsletter section?")) return;
        siteData.newsletterBlock = siteData.newsletterBlock || {};
        siteData.newsletterBlock.enabled = false;
        refresh();
      }
    }
  };
})();
