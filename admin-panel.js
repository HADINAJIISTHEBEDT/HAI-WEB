(function () {
  "use strict";

  var ADMIN_PASSWORD = "123hadi456";
  var AUTH_KEY = "hai_admin_unlocked";
  var STORAGE_KEY = "hai_site_content_local_v2";

  var dataApi = window.HaiSiteData;
  var siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);

  var form = document.querySelector("#site-form");
  var sectionsRoot = document.querySelector("#sections-editor");
  var statusBox = document.querySelector("#status");
  var dashboardStatusBox = document.querySelector("#dashboard-status");
  var preview = document.querySelector("#preview-frame");
  var loginShell = document.querySelector("#login-shell");
  var dashboardShell = document.querySelector("#dashboard-shell");
  var editorDrawer = document.querySelector("#editor-drawer");
  var closeEditorButton = document.querySelector("#close-editor");
  var loginButton = document.querySelector("#login-btn");
  var logoutButton = document.querySelector("#logout-btn");
  var addSectionTopButton = document.querySelector("#add-section-top");
  var adminPasswordInput = document.querySelector("#adminPassword");
  var uploadLogoButton = document.querySelector("#upload-logo");
  var uploadHeroButton = document.querySelector("#upload-hero");
  var logoFileInput = document.querySelector("#logoFile");
  var heroFileInput = document.querySelector("#heroFile");

  function notify(message, isError) {
    statusBox.textContent = message;
    statusBox.style.color = isError ? "#ff8ea6" : "#9bd0ff";
    if (dashboardStatusBox) {
      dashboardStatusBox.textContent = message;
      dashboardStatusBox.style.color = isError ? "#ff8ea6" : "#9bd0ff";
    }
  }

  function setUnlocked(unlocked) {
    loginShell.style.display = unlocked ? "none" : "block";
    dashboardShell.style.display = unlocked ? "block" : "none";
    if (editorDrawer) {
      editorDrawer.classList.remove("open");
    }
    if (unlocked) {
      localStorage.setItem(AUTH_KEY, "1");
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  function loadLocalData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        siteData = dataApi.normalize(JSON.parse(raw));
      } else {
        siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
      }
    } catch (error) {
      siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
    }
  }

  function saveLocalData() {
    siteData = dataApi.normalize(siteData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(siteData));
  }

  function createField(labelText, value, onChange, type) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    var input = document.createElement(type === "textarea" ? "textarea" : "input");
    input.value = value || "";
    input.addEventListener("input", function () {
      onChange(input.value);
    });
    wrap.appendChild(input);
    return wrap;
  }

  function createSelect(labelText, value, options, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    var select = document.createElement("select");
    options.forEach(function (option) {
      var opt = document.createElement("option");
      if (typeof option === "string") {
        opt.value = option;
        opt.textContent = option;
      } else {
        opt.value = option.value;
        opt.textContent = option.label;
      }
      if (opt.value === value) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener("change", function () {
      onChange(select.value);
    });
    wrap.appendChild(select);
    return wrap;
  }

  function createItemEditor(section, item, itemIndex) {
    var box = document.createElement("div");
    box.className = "item-editor";

    box.appendChild(
      createField("Item Title", item.title || "", function (value) {
        item.title = value;
      })
    );
    box.appendChild(
      createField("Item Description", item.description || "", function (value) {
        item.description = value;
      }, "textarea")
    );
    box.appendChild(
      createSelect(
        "Action Type",
        item.actionType || "link",
        [
          { value: "none", label: "Text only" },
          { value: "link", label: "Open Link" },
          { value: "video", label: "Open Video" },
          { value: "image", label: "Open Image" }
        ],
        function (value) {
          item.actionType = value;
        }
      )
    );
    box.appendChild(
      createField("Button Text", item.actionLabel || "Open", function (value) {
        item.actionLabel = value;
      })
    );
    box.appendChild(
      createField("Link URL", item.url || "", function (value) {
        item.url = value;
      })
    );
    box.appendChild(
      createField("Video URL", item.videoUrl || "", function (value) {
        item.videoUrl = value;
      })
    );
    box.appendChild(
      createField("Image URL", item.imageUrl || "", function (value) {
        item.imageUrl = value;
      })
    );

    var actions = document.createElement("div");
    actions.className = "mini-actions";

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn-danger";
    remove.textContent = "Remove Item";
    remove.addEventListener("click", function () {
      section.items.splice(itemIndex, 1);
      renderSectionsEditor();
    });
    actions.appendChild(remove);
    box.appendChild(actions);
    return box;
  }

  function createSectionEditor(section, sectionIndex) {
    var block = document.createElement("div");
    block.className = "section-editor";

    block.appendChild(
      createField("Section ID", section.id, function (value) {
        section.id = value.replace(/\s+/g, "-").toLowerCase() || dataApi.createId("section");
      })
    );
    block.appendChild(
      createField("Section Title", section.title, function (value) {
        section.title = value;
      })
    );
    block.appendChild(
      createSelect(
        "Section Type",
        section.type || "custom",
        ["custom", "about", "services", "apps", "links", "videos", "team", "portfolio", "testimonials", "pricing", "contact"],
        function (value) {
          section.type = value;
        }
      )
    );
    block.appendChild(
      createSelect("Section Visibility", section.enabled === false ? "false" : "true", [
        { value: "true", label: "Enabled" },
        { value: "false", label: "Disabled" }
      ], function (value) {
        section.enabled = value === "true";
      })
    );
    block.appendChild(
      createField("Section Description", section.description || "", function (value) {
        section.description = value;
      }, "textarea")
    );

    var itemTitle = document.createElement("h4");
    itemTitle.textContent = "Items";
    block.appendChild(itemTitle);

    if (!Array.isArray(section.items)) section.items = [];
    section.items.forEach(function (item, idx) {
      block.appendChild(createItemEditor(section, item, idx));
    });

    var itemActions = document.createElement("div");
    itemActions.className = "mini-actions";

    var addItem = document.createElement("button");
    addItem.type = "button";
    addItem.className = "btn-soft";
    addItem.textContent = "Add Item";
    addItem.addEventListener("click", function () {
      section.items.push({
        title: "New Item",
        description: "",
        actionType: "link",
        actionLabel: "Open",
        url: "",
        videoUrl: "",
        imageUrl: ""
      });
      renderSectionsEditor();
    });
    itemActions.appendChild(addItem);

    var removeSection = document.createElement("button");
    removeSection.type = "button";
    removeSection.className = "btn-danger";
    removeSection.textContent = "Remove Section";
    removeSection.addEventListener("click", function () {
      siteData.sections.splice(sectionIndex, 1);
      renderSectionsEditor();
    });
    itemActions.appendChild(removeSection);

    block.appendChild(itemActions);
    return block;
  }

  function renderSectionsEditor() {
    sectionsRoot.innerHTML = "";
    siteData.sections.forEach(function (section, index) {
      sectionsRoot.appendChild(createSectionEditor(section, index));
    });
  }

  function fillGlobalFields() {
    form.companyName.value = siteData.companyName;
    form.tagline.value = siteData.tagline;
    form.logoUrl.value = siteData.logoUrl;
    form.heroImageUrl.value = siteData.heroImageUrl;
    form.primaryColor.value = siteData.primaryColor;
    form.defaultLanguage.value = siteData.defaultLanguage || "en";
  }

  function syncFormToData() {
    siteData.companyName = form.companyName.value.trim() || "HAI SOFTWARE INTELLIGENCE";
    siteData.tagline = form.tagline.value.trim();
    siteData.logoUrl = form.logoUrl.value.trim();
    siteData.heroImageUrl = form.heroImageUrl.value.trim();
    siteData.primaryColor = form.primaryColor.value.trim() || "#1e72ff";
    siteData.defaultLanguage = form.defaultLanguage.value || "en";
  }

  function reloadPreview() {
    preview.src = "./index.html?admin=1&t=" + Date.now();
  }

  function updateInlineValue(type, sectionId, itemIndex, nextValue) {
    if (type === "company-name") {
      siteData.companyName = nextValue;
      return true;
    }
    if (type === "tagline") {
      siteData.tagline = nextValue;
      return true;
    }

    var section = (siteData.sections || []).find(function (s) {
      return s.id === sectionId;
    });
    if (!section) return false;

    if (type === "section-title") {
      section.title = nextValue;
      return true;
    }
    if (type === "section-description") {
      section.description = nextValue;
      return true;
    }

    var idx = Number(itemIndex);
    if (!Array.isArray(section.items) || Number.isNaN(idx) || !section.items[idx]) return false;
    var item = section.items[idx];

    if (type === "item-title") {
      item.title = nextValue;
      return true;
    }
    if (type === "item-description") {
      item.description = nextValue;
      return true;
    }
    if (type === "item-action-label") {
      item.actionLabel = nextValue;
      return true;
    }
    return false;
  }

  function addNewSection() {
    siteData.sections.push({
      id: dataApi.createId("section"),
      type: "custom",
      title: "New Section",
      description: "Describe this section.",
      enabled: true,
      items: []
    });
    renderSectionsEditor();
    saveLocalData();
    reloadPreview();
    notify("New section added.");
  }

  function addItemToSection(sectionId) {
    var section = (siteData.sections || []).find(function (s) {
      return s.id === sectionId;
    });
    if (!section) {
      notify("Section not found.", true);
      return;
    }
    if (!Array.isArray(section.items)) section.items = [];
    section.items.push({
      title: "New Item",
      description: "Click to edit this text.",
      actionType: "none",
      actionLabel: "Open",
      url: "",
      videoUrl: "",
      imageUrl: ""
    });
    renderSectionsEditor();
    saveLocalData();
    reloadPreview();
    notify("Card added.");
  }

  function deleteSection(sectionId) {
    var index = (siteData.sections || []).findIndex(function (s) {
      return s.id === sectionId;
    });
    if (index < 0) {
      notify("Section not found.", true);
      return;
    }
    if (!window.confirm("Delete this section?")) return;
    siteData.sections.splice(index, 1);
    renderSectionsEditor();
    saveLocalData();
    reloadPreview();
    notify("Section deleted.");
  }

  function deleteItem(sectionId, itemIndex) {
    var section = (siteData.sections || []).find(function (s) {
      return s.id === sectionId;
    });
    var idx = Number(itemIndex);
    if (!section || !Array.isArray(section.items) || Number.isNaN(idx) || !section.items[idx]) {
      notify("Card not found.", true);
      return;
    }
    if (!window.confirm("Delete this card?")) return;
    section.items.splice(idx, 1);
    renderSectionsEditor();
    saveLocalData();
    reloadPreview();
    notify("Card deleted.");
  }

  function handlePreviewMessage(event) {
    var data = event.data || {};
    if (data.source !== "hai-admin-preview") return;

    if (data.action === "add-section") {
      addNewSection();
      return;
    }
    if (data.action === "add-item") {
      addItemToSection(data.sectionId);
      return;
    }
    if (data.action === "delete-section") {
      deleteSection(data.sectionId);
      return;
    }
    if (data.action === "delete-item") {
      deleteItem(data.sectionId, data.itemIndex);
    }
  }

  function wireInlineEditing() {
    var doc = preview.contentDocument;
    if (!doc || !doc.body) return;
    doc.body.classList.add("admin-inline-mode");
    if (doc.body.dataset.inlineWired === "1") return;
    doc.body.dataset.inlineWired = "1";

    doc.querySelectorAll("[data-inline-edit]").forEach(function (editable) {
      editable.setAttribute("contenteditable", "true");
      editable.classList.add("inline-editable");
      editable.setAttribute("spellcheck", "false");

      editable.addEventListener("click", function (event) {
        if (editable.tagName.toLowerCase() === "a") {
          event.preventDefault();
        }
        event.stopPropagation();
      });

      editable.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();
          editable.blur();
        }
      });

      editable.addEventListener("blur", function () {
        var type = editable.getAttribute("data-inline-edit");
        var sectionId = editable.getAttribute("data-section-id") || "";
        var itemIndex = editable.getAttribute("data-item-index") || "";
        var next = (editable.textContent || "").trim();
        if (!updateInlineValue(type, sectionId, itemIndex, next)) {
          notify("Could not update selected item.", true);
          return;
        }
        fillGlobalFields();
        renderSectionsEditor();
        saveLocalData();
        notify("Updated.");
      });
    });
  }

  function uploadImage(fileInput, targetField) {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      notify("Choose an image first.", true);
      return;
    }
    var reader = new FileReader();
    reader.onload = function () {
      form[targetField].value = reader.result;
      syncFormToData();
      saveLocalData();
      reloadPreview();
      notify("Image loaded and saved.");
    };
    reader.readAsDataURL(file);
  }

  document.querySelector("#add-section").addEventListener("click", addNewSection);
  if (addSectionTopButton) {
    addSectionTopButton.addEventListener("click", addNewSection);
  }

  document.querySelector("#save-site").addEventListener("click", function () {
    syncFormToData();
    saveLocalData();
    reloadPreview();
    notify("Saved successfully.");
  });

  document.querySelector("#reset-site").addEventListener("click", function () {
    if (!window.confirm("Reset content to default?")) return;
    siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
    fillGlobalFields();
    renderSectionsEditor();
    saveLocalData();
    reloadPreview();
    notify("Reset done.");
  });

  document.querySelector("#preview-site").addEventListener("click", function () {
    syncFormToData();
    saveLocalData();
    reloadPreview();
    notify("Preview refreshed.");
  });

  document.querySelector("#export-json").addEventListener("click", function () {
    syncFormToData();
    var payload = JSON.stringify(siteData, null, 2);
    var blob = new Blob([payload], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "hai-site-content.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify("Exported JSON file.");
  });

  document.querySelector("#import-json").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        siteData = dataApi.normalize(JSON.parse(reader.result));
        fillGlobalFields();
        renderSectionsEditor();
        saveLocalData();
        reloadPreview();
        notify("Imported and saved.");
      } catch (error) {
        notify("Invalid JSON file.", true);
      }
    };
    reader.readAsText(file);
  });

  loginButton.addEventListener("click", function () {
    if ((adminPasswordInput.value || "").trim() !== ADMIN_PASSWORD) {
      notify("Wrong password.", true);
      return;
    }
    setUnlocked(true);
    fillGlobalFields();
    renderSectionsEditor();
    reloadPreview();
    notify("Dashboard unlocked. Click any text directly and type.");
    adminPasswordInput.value = "";
  });

  logoutButton.addEventListener("click", function () {
    setUnlocked(false);
    notify("Admin locked.");
  });

  if (closeEditorButton) {
    closeEditorButton.addEventListener("click", function () {
      editorDrawer.classList.remove("open");
    });
  }

  uploadLogoButton.addEventListener("click", function () {
    uploadImage(logoFileInput, "logoUrl");
  });

  uploadHeroButton.addEventListener("click", function () {
    uploadImage(heroFileInput, "heroImageUrl");
  });
  preview.addEventListener("load", wireInlineEditing);
  window.addEventListener("message", handlePreviewMessage);

  loadLocalData();
  if (localStorage.getItem(AUTH_KEY) === "1") {
    setUnlocked(true);
    fillGlobalFields();
    renderSectionsEditor();
    reloadPreview();
    notify("Dashboard ready. Click any text directly and type.");
  } else {
    setUnlocked(false);
    notify("Enter admin password to continue.");
  }
})();
