(function () {
  "use strict";

  var dataApi = window.HaiSiteData;
  var currentLanguage = "en";
  var currentSectionId = "";
  var latestSiteData = null;
  var LOCAL_CONTENT_KEY = "hai_site_content_local_v2";
  var isAdminPreview =
    localStorage.getItem("hai_admin_unlocked") === "1" &&
    (new URLSearchParams(window.location.search).get("admin") === "1" ||
      localStorage.getItem("hai_admin_preview") === "1" ||
      (window.location.hash || "").toLowerCase() === "#admin");
  var dragState = null;
  var pendingCardFocus = null;

  function sendAdminAction(payload) {
    if (!isAdminPreview) return;
    if (window.HaiAdminLive && typeof window.HaiAdminLive.handleAction === "function") {
      window.HaiAdminLive.handleAction(payload);
      return;
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        Object.assign({ source: "hai-admin-preview" }, payload),
        "*"
      );
    }
  }

  function createHoverToolbar(buttons, extraClass) {
    var bar = document.createElement("div");
    bar.className = "hover-toolbar" + (extraClass ? " " + extraClass : "");
    buttons.forEach(function (btnDef) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "hover-btn " + (btnDef.className || "");
      btn.textContent = btnDef.label;
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        btnDef.onClick();
      });
      bar.appendChild(btn);
    });
    return bar;
  }

  function focusCardInView(sectionId, cardIndex) {
    var selector =
      '[data-card-ref="' + sectionId + "/" + cardIndex + '"], #card-' + sectionId + "-" + cardIndex;
    var card = document.querySelector(selector);
    if (!card) return false;
    card.classList.add("card-deep-link-focus");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(function () {
      card.classList.remove("card-deep-link-focus");
    }, 2600);
    var action = card.querySelector(".card-action");
    if (action && typeof action.click === "function") {
      window.setTimeout(function () {
        try {
          action.click();
        } catch (error) {}
      }, 400);
    }
    return true;
  }

  function navigateToHash(hash) {
    var id = String(hash || "")
      .replace(/^#/, "")
      .trim();
    if (!id || !latestSiteData) return false;

    var cardMatch = id.match(/^([^/]+)\/card\/(\d+)$/i);
    if (cardMatch) {
      var sectionId = cardMatch[1];
      var cardIndex = Number(cardMatch[2]);
      var section = (latestSiteData.sections || []).find(function (item) {
        return item.id === sectionId && item.enabled !== false;
      });
      if (!section) return false;
      pendingCardFocus = { sectionId: sectionId, cardIndex: cardIndex };
      currentSectionId = sectionId;
      renderPage(latestSiteData);
      return true;
    }

    var plainSection = (latestSiteData.sections || []).find(function (item) {
      return item.id === id && item.enabled !== false;
    });
    if (plainSection) {
      currentSectionId = plainSection.id;
      renderPage(latestSiteData);
      var sectionsRoot = document.querySelector("[data-sections]");
      if (sectionsRoot) {
        sectionsRoot.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return true;
    }

    var el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
    return false;
  }

  function wireSiteHashLinks() {
    document.addEventListener("click", function (event) {
      if (document.body.classList.contains("admin-inline-mode")) return;
      var link = event.target.closest(
        "a.hero-cta, a.section-cta, .footer-link-item a, a[data-section-hash], a.card-action"
      );
      if (!link) return;
      var href = link.getAttribute("href") || "";
      if (href.charAt(0) !== "#") return;
      if (navigateToHash(href)) {
        event.preventDefault();
      }
    });
  }

  function clearDragMarks() {
    document.querySelectorAll(".drag-over, .drag-insert-before, .drag-insert-after, .drag-ghost, .drop-slot-active").forEach(function (node) {
      node.classList.remove(
        "drag-over",
        "drag-insert-before",
        "drag-insert-after",
        "drag-ghost",
        "drop-slot-active"
      );
    });
    document.querySelectorAll(".drop-slot").forEach(function (node) {
      node.remove();
    });
    var line = document.querySelector("#drag-drop-line");
    if (line) line.remove();
  }

  function isHorizontalGroup(group) {
    return (
      group === "badges" ||
      group === "ctas" ||
      group === "footer" ||
      group === "social" ||
      group === "footer-cols" ||
      group === "section-btns"
    );
  }

  function getGroupItems(group, sectionId) {
    var nodes = Array.prototype.slice.call(
      document.querySelectorAll('.is-draggable[data-drag-group="' + group + '"]')
    );
    if (group === "items" || group === "section-btns") {
      nodes = nodes.filter(function (node) {
        return (node.getAttribute("data-drag-section") || "") === (sectionId || "");
      });
    }
    nodes.sort(function (a, b) {
      return Number(a.getAttribute("data-drag-index")) - Number(b.getAttribute("data-drag-index"));
    });
    return nodes;
  }

  // Build empty drop slots between items (paste targets, not swap targets)
  function buildEmptySlots(group, sectionId, fromEl, fromIndex) {
    clearDragMarks();
    fromEl.classList.add("drag-source-empty");
    var items = getGroupItems(group, sectionId);
    var parent = fromEl.parentElement;
    if (!parent) return;

    var horizontal = isHorizontalGroup(group);
    var total = items.length;

    function makeSlot(pasteIndex) {
      var slot = document.createElement("div");
      slot.className = "drop-slot" + (horizontal ? " drop-slot-h" : " drop-slot-v");
      slot.setAttribute("data-paste-index", String(pasteIndex));
      slot.setAttribute("data-drag-group", group);
      if (sectionId) slot.setAttribute("data-drag-section", sectionId);
      slot.innerHTML = "<span>Empty — drop here</span>";
      return slot;
    }

    // Slot before each item (except useless neighbor slots of the dragged item)
    items.forEach(function (item) {
      var idx = Number(item.getAttribute("data-drag-index"));
      if (idx === fromIndex) return;
      var slot = makeSlot(idx);
      parent.insertBefore(slot, item);
    });

    // Slot at the very end
    var endSlot = makeSlot(total);
    parent.appendChild(endSlot);
  }

  function findSlotUnderPointer(clientX, clientY) {
    var under = document.elementFromPoint(clientX, clientY);
    if (!under) return null;
    return under.closest(".drop-slot");
  }

  function enableDragReorder(el, group, index, sectionId) {
    if (!isAdminPreview || !el) return;
    el.classList.add("is-draggable");
    el.setAttribute("data-drag-group", group);
    el.setAttribute("data-drag-index", String(index));
    if (sectionId) el.setAttribute("data-drag-section", sectionId);
    else el.removeAttribute("data-drag-section");
    el.draggable = false;

    var handle = el.querySelector(".drag-handle");
    if (!handle) {
      handle = document.createElement("span");
      handle.className = "drag-handle";
      handle.title = "Drag to an empty drop place";
      handle.textContent = "⋮⋮";
      el.insertBefore(handle, el.firstChild);
    }

    if (el.dataset.dragWired === "1") return;
    el.dataset.dragWired = "1";

    function onPointerDown(event) {
      if (event.button != null && event.button !== 0) return;
      if (event.target.closest(".hover-btn, .hover-toolbar, input, textarea, select, button")) return;
      if (
        event.target.closest("[contenteditable='true']") &&
        document.activeElement === event.target.closest("[contenteditable='true']")
      ) {
        return;
      }

      event.preventDefault();
      try {
        el.setPointerCapture(event.pointerId);
      } catch (error) {}

      var startX = event.clientX;
      var startY = event.clientY;
      var moved = false;
      var fromIndex = Number(el.getAttribute("data-drag-index"));
      var sec = el.getAttribute("data-drag-section") || "";
      var slotsReady = false;

      dragState = {
        group: group,
        fromIndex: fromIndex,
        sectionId: sec,
        el: el,
        insertAt: null
      };

      function onMove(ev) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) > 4) moved = true;
        if (!moved || !dragState) return;

        if (!slotsReady) {
          buildEmptySlots(group, sec, el, fromIndex);
          el.classList.add("is-dragging");
          document.body.classList.add("is-drag-active");
          slotsReady = true;
        }

        document.querySelectorAll(".drop-slot-active").forEach(function (node) {
          node.classList.remove("drop-slot-active");
        });

        var slot = findSlotUnderPointer(ev.clientX, ev.clientY);
        if (slot) {
          slot.classList.add("drop-slot-active");
          dragState.insertAt = Number(slot.getAttribute("data-paste-index"));
        } else {
          dragState.insertAt = null;
        }
      }

      function onUp() {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        try {
          el.releasePointerCapture(event.pointerId);
        } catch (error) {}

        var state = dragState;
        var pasteAt = state ? state.insertAt : null;

        el.classList.remove("is-dragging", "drag-source-empty");
        document.body.classList.remove("is-drag-active");
        clearDragMarks();
        dragState = null;

        if (!state || !moved || pasteAt == null || Number.isNaN(pasteAt)) return;
        // No-op if dropping into the hole left by itself
        if (pasteAt === state.fromIndex || pasteAt === state.fromIndex + 1) return;

        sendAdminAction({
          action: "reorder",
          group: state.group,
          sectionId: state.sectionId,
          fromIndex: state.fromIndex,
          toIndex: pasteAt,
          mode: "insert"
        });
      }

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    }

    handle.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerdown", function (event) {
      if (event.target.closest(".drag-handle")) return;
      onPointerDown(event);
    });
  }

  var SECTION_I18N = {
    ar: {
      about: {
        title: "من نحن",
        description:
          "HAI SOFTWARE INTELLIGENCE شركة برمجيات متخصصة في المنصات الذكية وأتمتة الأعمال وبناء الأنظمة الموثوقة."
      },
      services: {
        title: "خدماتنا",
        description: "نقدّم خدمات برمجية متكاملة من التخطيط والتصميم إلى الإطلاق والتطوير المستمر."
      },
      solutions: {
        title: "القطاعات والحلول",
        description: "نطوّر حلولاً رقمية مخصصة لقطاعات ونماذج عمل مختلفة."
      },
      apps: {
        title: "التطبيقات والمنتجات",
        description: "مجموعة متنامية من المنتجات البرمجية التي تطورها HAI."
      },
      links: {
        title: "روابط مهمة",
        description: "روابط رسمية وموارد مفيدة وقنوات تواصل مباشرة."
      },
      videos: {
        title: "الفيديوهات",
        description: "فيديوهات تعريفية وعروض للمنتجات وشروحات عملية."
      },
      process: {
        title: "طريقة عملنا",
        description: "منهج عمل منظم يركز على السرعة والجودة والشفافية في كل مرحلة."
      },
      "tech-stack": {
        title: "التقنيات المستخدمة",
        description: "نعتمد تقنيات حديثة وموثوقة للواجهات والخوادم والبيانات والحوسبة السحابية."
      },
      faq: {
        title: "الأسئلة الشائعة",
        description: "إجابات واضحة عن أكثر الأسئلة شيوعاً حول خدماتنا وآلية التعاون والجداول الزمنية."
      },
      team: {
        title: "فريقنا",
        description: "فريق متعدد التخصصات من المهندسين والمصممين وخبراء المنتجات الرقمية."
      },
      portfolio: {
        title: "الأعمال والمشاريع",
        description: "نماذج مختارة من المشاريع والحلول البرمجية التي أنجزناها."
      },
      testimonials: {
        title: "آراء العملاء",
        description: "ماذا يقول عملاؤنا عن العمل مع HAI."
      },
      pricing: {
        title: "الباقات والأسعار",
        description: "نماذج تعاون مرنة للشركات الناشئة والشركات المتوسطة والمؤسسات."
      },
      contact: {
        title: "التواصل",
        description:
          "البريد: contact@haisoftware.com | الهاتف: +961 00 000 000 | العنوان: لبنان"
      }
    }
  };

  function setThemeColor(color) {
    var valid = /^#[\da-fA-F]{6}$/.test(color) ? color : "#1e72ff";
    document.documentElement.style.setProperty("--primary", valid);
  }

  function applyFooterColumnOrder(data) {
    var grid = document.querySelector("[data-footer-grid]");
    if (!grid) return;
    var order =
      Array.isArray(data.footerOrder) && data.footerOrder.length
        ? data.footerOrder.slice()
        : ["brand", "links", "social"];
    order.forEach(function (key, index) {
      var col = grid.querySelector('[data-footer-col="' + key + '"]');
      if (!col) return;
      grid.appendChild(col);
      if (isAdminPreview) {
        col.classList.add("editable-block", "footer-col-draggable");
        enableDragReorder(col, "footer-cols", index);
      }
    });
  }

  function applyFreeTextOverrides(data) {
    var map = data && data.textOverrides ? data.textOverrides : null;
    if (!map) return;
    Object.keys(map).forEach(function (key) {
      var el = document.querySelector('[data-free-text="' + key + '"]');
      if (!el && key.indexOf("id:") === 0) {
        el = document.getElementById(key.slice(3));
      }
      if (el) el.textContent = map[key];
    });
  }

  function createSafeText(value) {
    return (value || "").toString();
  }

  function getLanguageData(data, lang) {
    if (!data || !data.translations) return {};
    return data.translations[lang] || {};
  }

  function localizeSection(section, lang) {
    var table = SECTION_I18N[lang] || {};
    var match = table[section.id] || {};
    return {
      title: match.title || section.title,
      description: match.description || section.description
    };
  }

  function getLocalizedItemText(item, lang, field) {
    if (item && item.i18n && item.i18n[lang] && item.i18n[lang][field]) {
      return item.i18n[lang][field];
    }
    return item && item[field] ? item[field] : "";
  }

  function getYouTubeEmbed(url) {
    if (!url) return "";
    var value = url.trim();
    var direct = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/i);
    if (direct && direct[1]) {
      return "https://www.youtube.com/embed/" + direct[1];
    }
    if (value.indexOf("youtube.com/embed/") > -1) {
      return value;
    }
    return "";
  }

  function openMediaModal(title, contentNode) {
    var existing = document.querySelector(".media-modal");
    if (existing) existing.remove();

    var modal = document.createElement("div");
    modal.className = "media-modal";
    modal.innerHTML =
      '<div class="media-modal-backdrop"></div><div class="media-modal-card"><button class="media-modal-close">x</button><h3></h3><div class="media-modal-body"></div></div>';
    modal.querySelector("h3").textContent = title || "Preview";
    modal.querySelector(".media-modal-body").appendChild(contentNode);
    modal.querySelector(".media-modal-backdrop").addEventListener("click", function () {
      modal.remove();
    });
    modal.querySelector(".media-modal-close").addEventListener("click", function () {
      modal.remove();
    });
    document.body.appendChild(modal);
  }

  function resolveCardAction(item) {
    var actionType = (item && item.actionType) || "";
    if (actionType && actionType !== "none") return actionType;
    if (item && item.videoUrl) return "video";
    if (item && item.imageUrl) return "image";
    if (item && item.url) return "link";
    return "link";
  }

  function createActionButton(item, uiLabels, sectionId, itemIndex) {
    var rawType = (item && item.actionType) || "";
    // Always render a visible working button (Contact Us fallback when no action is set).
    var actionType = resolveCardAction(item || {});
    if (rawType === "none") actionType = "link";

    var hasExplicitTarget = !!(item && (item.url || item.videoUrl || item.imageUrl));
    var buttonLabel =
      (item && item.actionLabel) ||
      (hasExplicitTarget ? uiLabels.openLink || "Open" : "Contact Us");
    var href = (item && item.url) || "#contact";

    var wrap = document.createElement("div");
    wrap.className = "card-actions card-action-wrap";
    var btn = document.createElement("a");
    btn.href = href;
    btn.className =
      "card-action " +
      ((item && item.actionStyle === "soft") || rawType === "none" || (!hasExplicitTarget && actionType === "link")
        ? "btn-soft"
        : "btn-primary");
    btn.textContent = buttonLabel;
    if (isAdminPreview) {
      btn.setAttribute("data-inline-edit", "item-action-label");
      btn.setAttribute("data-section-id", sectionId || "");
      btn.setAttribute("data-item-index", String(itemIndex));
    }
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      if (isAdminPreview) return;
      var type = resolveCardAction(item || {});
      if (rawType === "none") type = "link";
      if (type === "link") {
        var linkUrl = (item && item.url) || "#contact";
        if (String(linkUrl).charAt(0) === "#") {
          navigateToHash(linkUrl);
          return;
        }
        window.open(linkUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (type === "section" || type === "card") {
        navigateToHash((item && item.url) || "#");
        return;
      }
      if (type === "video") {
        var embedUrl = getYouTubeEmbed((item && item.videoUrl) || (item && item.url));
        if (embedUrl) {
          var iframe = document.createElement("iframe");
          iframe.src = embedUrl;
          iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          iframe.referrerPolicy = "strict-origin-when-cross-origin";
          iframe.allowFullscreen = true;
          iframe.style.width = "100%";
          iframe.style.height = "360px";
          iframe.style.border = "0";
          openMediaModal((item && item.title) || "Video", iframe);
        } else if (item && item.videoUrl) {
          window.open(item.videoUrl, "_blank", "noopener,noreferrer");
        }
        return;
      }
      if (type === "image" && item && item.imageUrl) {
        var img = document.createElement("img");
        img.src = item.imageUrl;
        img.alt = (item && item.title) || "Image";
        img.style.width = "100%";
        openMediaModal((item && item.title) || "Image", img);
        return;
      }
      navigateToHash("#contact");
    });
    wrap.appendChild(btn);
    if (isAdminPreview) {
      var del = document.createElement("button");
      del.type = "button";
      del.className = "card-action-del";
      del.textContent = "×";
      del.title = "Remove button";
      del.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        sendAdminAction({
          action: "remove-card-btn",
          sectionId: sectionId,
          itemIndex: itemIndex
        });
      });
      wrap.appendChild(del);
    }
    return wrap;
  }

  function appendCardActions(card, actionWrap) {
    if (!card || !actionWrap) return;
    var row = card.querySelector(".card-actions");
    if (!row) {
      row = document.createElement("div");
      row.className = "card-actions";
      card.appendChild(row);
    }
    while (actionWrap.firstChild) {
      row.appendChild(actionWrap.firstChild);
    }
  }

  function decorateCard(card, section, itemIndex) {
    card.setAttribute("data-card-ref", section.id + "/" + itemIndex);
    card.id = "card-" + section.id + "-" + itemIndex;
    if (!isAdminPreview) return card;
    card.classList.add("editable-block");
    card.appendChild(
      createHoverToolbar([
        {
          label: "+ Add",
          className: "hover-btn-add",
          onClick: function () {
            sendAdminAction({ action: "add-item", sectionId: section.id });
          }
        },
        {
          label: "Img",
          className: "hover-btn-link",
          onClick: function () {
            sendAdminAction({
              action: "set-card-image",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "+ Btn",
          className: "hover-btn-add",
          onClick: function () {
            sendAdminAction({
              action: "add-card-btn",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "Link",
          className: "hover-btn-link",
          onClick: function () {
            sendAdminAction({
              action: "edit-link",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "Dup",
          className: "hover-btn-add",
          onClick: function () {
            sendAdminAction({
              action: "duplicate-item",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "Up",
          className: "hover-btn-add",
          onClick: function () {
            sendAdminAction({
              action: "move-item-up",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "Down",
          className: "hover-btn-add",
          onClick: function () {
            sendAdminAction({
              action: "move-item-down",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        },
        {
          label: "Delete",
          className: "hover-btn-delete",
          onClick: function () {
            sendAdminAction({
              action: "delete-item",
              sectionId: section.id,
              itemIndex: itemIndex
            });
          }
        }
      ])
    );
    enableDragReorder(card, "items", itemIndex, section.id);
    return card;
  }

  function renderSection(section, lang, uiLabels) {
    var wrapper = document.createElement("section");
    wrapper.className = "section reveal show";
    wrapper.id = section.id;
    if (isAdminPreview) {
      wrapper.classList.add("editable-block");
      wrapper.appendChild(
        createHoverToolbar([
          {
            label: "+ Section",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "add-section" });
            }
          },
          {
            label: "+ Card",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "add-item", sectionId: section.id });
            }
          },
          {
            label: "+ Btn",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "add-section-btn", sectionId: section.id });
            }
          },
          {
            label: "Img",
            className: "hover-btn-link",
            onClick: function () {
              sendAdminAction({ action: "set-section-image", sectionId: section.id });
            }
          },
          {
            label: "Dup",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "duplicate-section", sectionId: section.id });
            }
          },
          {
            label: "Up",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "move-section-up", sectionId: section.id });
            }
          },
          {
            label: "Down",
            className: "hover-btn-add",
            onClick: function () {
              sendAdminAction({ action: "move-section-down", sectionId: section.id });
            }
          },
          {
            label: "Delete",
            className: "hover-btn-delete",
            onClick: function () {
              sendAdminAction({ action: "delete-section", sectionId: section.id });
            }
          }
        ])
      );
    }

    var localizedSection = localizeSection(section, lang);

    var title = document.createElement("h2");
    title.textContent = createSafeText(localizedSection.title);
    if (isAdminPreview) {
      title.setAttribute("data-inline-edit", "section-title");
      title.setAttribute("data-section-id", section.id);
    }
    wrapper.appendChild(title);

    if (localizedSection.description || isAdminPreview) {
      var desc = document.createElement("p");
      desc.className = "section-description";
      desc.textContent = createSafeText(localizedSection.description || "");
      if (isAdminPreview) {
        desc.setAttribute("data-inline-edit", "section-description");
        desc.setAttribute("data-section-id", section.id);
      }
      wrapper.appendChild(desc);
    }

    if (section.imageUrl) {
      var sectionImg = document.createElement("img");
      sectionImg.className = "section-cover-image";
      sectionImg.src = section.imageUrl;
      sectionImg.alt = localizedSection.title || "Section";
      wrapper.appendChild(sectionImg);
    }

    var sectionBtns = Array.isArray(section.buttons) ? section.buttons : [];
    if (sectionBtns.length || isAdminPreview) {
      var btnsRow = document.createElement("div");
      btnsRow.className = "section-actions";
      sectionBtns.forEach(function (btnDef, btnIndex) {
        var wrap = document.createElement("div");
        wrap.className = "section-btn-item editable-block";
        var a = document.createElement("a");
        a.className = (btnDef.style === "soft" ? "btn-soft" : "btn-primary") + " section-cta";
        a.href = btnDef.href || "#";
        var label = document.createElement("span");
        label.textContent = btnDef.label || "Button";
        if (isAdminPreview) {
          label.setAttribute("data-inline-edit", "section-btn-label");
          label.setAttribute("data-section-id", section.id);
          label.setAttribute("data-item-index", String(btnIndex));
        }
        a.appendChild(label);
        wrap.appendChild(a);
        if (isAdminPreview) {
          wrap.appendChild(
            createHoverToolbar(
              [
                {
                  label: "Edit",
                  className: "hover-btn-link",
                  onClick: function () {
                    sendAdminAction({
                      action: "edit-section-btn",
                      sectionId: section.id,
                      itemIndex: btnIndex
                    });
                  }
                },
                {
                  label: "Del",
                  className: "hover-btn-delete",
                  onClick: function () {
                    sendAdminAction({
                      action: "delete-section-btn",
                      sectionId: section.id,
                      itemIndex: btnIndex
                    });
                  }
                }
              ],
              "hover-toolbar-compact"
            )
          );
          enableDragReorder(wrap, "section-btns", btnIndex, section.id);
          a.addEventListener("click", function (event) {
            event.preventDefault();
          });
        } else {
          a.addEventListener("click", function (event) {
            var href = a.getAttribute("href") || "";
            if (href.charAt(0) === "#" && navigateToHash(href)) event.preventDefault();
          });
        }
        btnsRow.appendChild(wrap);
      });
      wrapper.appendChild(btnsRow);
    }

    var items = Array.isArray(section.items) ? section.items : [];

    if (section.type === "videos") {
      var videoGrid = document.createElement("div");
      videoGrid.className = "video-grid";
      items.forEach(function (item, itemIndex) {
        var card = document.createElement("div");
        card.className = "card";

        var h3 = document.createElement("h3");
        h3.textContent = getLocalizedItemText(item, lang, "title") || "Video";
        if (isAdminPreview) {
          h3.setAttribute("data-inline-edit", "item-title");
          h3.setAttribute("data-section-id", section.id);
          h3.setAttribute("data-item-index", String(itemIndex));
        }
        card.appendChild(h3);

        var embed = getYouTubeEmbed(item.videoUrl || item.url);
        if (embed) {
          var frameWrap = document.createElement("div");
          frameWrap.className = "video-frame";
          var iframe = document.createElement("iframe");
          iframe.src = embed;
          iframe.title = item.title || "Embedded Video";
          iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
          iframe.referrerPolicy = "strict-origin-when-cross-origin";
          iframe.allowFullscreen = true;
          frameWrap.appendChild(iframe);
          card.appendChild(frameWrap);
        } else if (item.videoUrl) {
          var p = document.createElement("p");
          p.textContent = (uiLabels.videoUrlLabel || "Video URL:") + " " + item.videoUrl;
          card.appendChild(p);
        }

        if (getLocalizedItemText(item, lang, "description") || isAdminPreview) {
          var d = document.createElement("p");
          d.textContent = getLocalizedItemText(item, lang, "description") || "";
          if (isAdminPreview) {
            d.setAttribute("data-inline-edit", "item-description");
            d.setAttribute("data-section-id", section.id);
            d.setAttribute("data-item-index", String(itemIndex));
          }
          card.appendChild(d);
        }

        var videoBtn = createActionButton(
          Object.assign({}, item, {
            actionType: item.actionType && item.actionType !== "none" ? item.actionType : "video",
            actionLabel: item.actionLabel || "Watch Video",
            videoUrl: item.videoUrl || item.url
          }),
          uiLabels,
          section.id,
          itemIndex
        );
        if (videoBtn) appendCardActions(card, videoBtn);

        videoGrid.appendChild(decorateCard(card, section, itemIndex));
      });
      wrapper.appendChild(videoGrid);
      return wrapper;
    }

    var grid = document.createElement("div");
    grid.className = "card-grid";

    items.forEach(function (item, itemIndex) {
      var card = document.createElement("article");
      card.className = "card";

      var titleEl = document.createElement("h3");
      titleEl.textContent = getLocalizedItemText(item, lang, "title") || "Item";
      if (isAdminPreview) {
        titleEl.setAttribute("data-inline-edit", "item-title");
        titleEl.setAttribute("data-section-id", section.id);
        titleEl.setAttribute("data-item-index", String(itemIndex));
      }
      card.appendChild(titleEl);

      if (item.imageUrl) {
        var cardImg = document.createElement("img");
        cardImg.className = "card-image";
        cardImg.src = item.imageUrl;
        cardImg.alt = item.title || "Card image";
        card.appendChild(cardImg);
      }

      if (getLocalizedItemText(item, lang, "description") || isAdminPreview) {
        var p = document.createElement("p");
        p.textContent = getLocalizedItemText(item, lang, "description") || "";
        if (isAdminPreview) {
          p.setAttribute("data-inline-edit", "item-description");
          p.setAttribute("data-section-id", section.id);
          p.setAttribute("data-item-index", String(itemIndex));
        }
        card.appendChild(p);
      }

      var actionBtn = createActionButton(item, uiLabels, section.id, itemIndex);
      if (actionBtn) {
        appendCardActions(card, actionBtn);
      } else if (item.url) {
        var plainWrap = document.createElement("div");
        plainWrap.className = "card-actions";
        var link = document.createElement("a");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "card-action btn-soft";
        link.textContent = uiLabels.openLink || "Open Link";
        plainWrap.appendChild(link);
        appendCardActions(card, plainWrap);
      }

      grid.appendChild(decorateCard(card, section, itemIndex));
    });

    if (isAdminPreview && !items.length) {
      var empty = document.createElement("p");
      empty.className = "section-description";
      empty.textContent = "No cards yet. Hover this section and click + Add Card.";
      wrapper.appendChild(empty);
    }

    wrapper.appendChild(grid);
    return wrapper;
  }

  function applyLanguageDirection(lang) {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }

  function renderLanguageSwitch(data) {
    var switcher = document.querySelector("#language-switch");
    if (!switcher) return;
    switcher.innerHTML = "";

    var options = [
      { code: "en", label: "English" },
      { code: "ar", label: "العربية" }
    ];

    options.forEach(function (opt) {
      var option = document.createElement("option");
      option.value = opt.code;
      option.textContent = opt.label;
      option.selected = currentLanguage === opt.code;
      switcher.appendChild(option);
    });

    if (!switcher.dataset.bound) {
      switcher.addEventListener("change", function () {
        currentLanguage = switcher.value;
        renderPage(data);
      });
      switcher.dataset.bound = "1";
    }
  }

  function renderPage(data) {
    latestSiteData = data;
    var langData = getLanguageData(data, currentLanguage);
    var uiLabels = langData.ui || {};
    var localizedCompany = langData.companyName || data.companyName;
    var localizedTagline = langData.tagline || data.tagline;

    applyLanguageDirection(currentLanguage);
    renderLanguageSwitch(data);
    document.title = localizedCompany;

    var companyNameEls = document.querySelectorAll("[data-company-name]");
    companyNameEls.forEach(function (el) {
      el.textContent = localizedCompany;
      if (isAdminPreview) {
        el.setAttribute("data-inline-edit", "company-name");
      }
    });

    var tagline = document.querySelector("[data-tagline]");
    if (tagline) {
      tagline.textContent = localizedTagline;
      if (isAdminPreview) {
        tagline.setAttribute("data-inline-edit", "tagline");
      }
    }

    var badgesRoot = document.querySelector("[data-badges]");
    if (badgesRoot) {
      badgesRoot.innerHTML = "";
      var badges = Array.isArray(data.badges) && data.badges.length
        ? data.badges
        : (Array.isArray(langData.badges) ? langData.badges.map(function (text, i) {
            return { id: "legacy-" + i, text: text };
          }) : []);
      badges.forEach(function (badge, badgeIndex) {
        var wrap = document.createElement("span");
        wrap.className = "badge-chip editable-block";
        var textEl = document.createElement("span");
        textEl.textContent = badge.text || badge;
        if (isAdminPreview) {
          textEl.setAttribute("data-inline-edit", "badge-text");
          textEl.setAttribute("data-item-index", String(badgeIndex));
        }
        wrap.appendChild(textEl);
        if (isAdminPreview) {
          wrap.appendChild(
            createHoverToolbar(
              [
                {
                  label: "Del",
                  className: "hover-btn-delete",
                  onClick: function () {
                    sendAdminAction({ action: "delete-badge", itemIndex: badgeIndex });
                  }
                }
              ],
              "hover-toolbar-compact"
            )
          );
          enableDragReorder(wrap, "badges", badgeIndex);
        }
        badgesRoot.appendChild(wrap);
      });
      if (isAdminPreview) {
        var addBadgeBtn = document.createElement("button");
        addBadgeBtn.type = "button";
        addBadgeBtn.className = "hover-btn hover-btn-add add-inline-btn";
        addBadgeBtn.textContent = "+ Badge";
        addBadgeBtn.addEventListener("click", function () {
          sendAdminAction({ action: "add-badge" });
        });
        badgesRoot.appendChild(addBadgeBtn);
      }
    }

    var ctasRoot = document.querySelector("[data-hero-ctas]");
    if (ctasRoot) {
      ctasRoot.innerHTML = "";
      (data.heroCtas || []).forEach(function (cta, ctaIndex) {
        var item = document.createElement("div");
        item.className = "cta-item editable-block";

        var link = document.createElement("a");
        link.className = (cta.style === "soft" ? "btn-soft" : "btn-primary") + " hero-cta";
        link.href = cta.href || "#";
        var label = document.createElement("span");
        label.textContent = cta.label || "Button";
        if (isAdminPreview) {
          label.setAttribute("data-inline-edit", "cta-label");
          label.setAttribute("data-item-index", String(ctaIndex));
        }
        link.appendChild(label);
        item.appendChild(link);

        if (isAdminPreview) {
          var linkHint = document.createElement("div");
          linkHint.className = "admin-link-hint";
          linkHint.textContent = cta.href || "#";
          item.appendChild(linkHint);
          item.appendChild(
            createHoverToolbar(
              [
                {
                  label: "Edit",
                  className: "hover-btn-link",
                  onClick: function () {
                    sendAdminAction({ action: "edit-cta", itemIndex: ctaIndex });
                  }
                },
                {
                  label: "Del",
                  className: "hover-btn-delete",
                  onClick: function () {
                    sendAdminAction({ action: "delete-cta", itemIndex: ctaIndex });
                  }
                }
              ],
              "hover-toolbar-compact"
            )
          );
          enableDragReorder(item, "ctas", ctaIndex);
          link.addEventListener("click", function (event) {
            event.preventDefault();
          });
        }
        ctasRoot.appendChild(item);
      });
      if (isAdminPreview) {
        var addCtaBtn = document.createElement("button");
        addCtaBtn.type = "button";
        addCtaBtn.className = "hover-btn hover-btn-add add-inline-btn hero-add-btn";
        addCtaBtn.textContent = "+ Btn";
        addCtaBtn.title = "Add button next to Contact Us";
        addCtaBtn.addEventListener("click", function () {
          sendAdminAction({ action: "add-cta" });
        });
        ctasRoot.appendChild(addCtaBtn);
      }
    }

    var contactBlock = data.contactBlock || {};
    var contactSection = document.querySelector("[data-contact-block]");
    if (contactSection) {
      contactSection.style.display = contactBlock.enabled === false ? "none" : "";
      var contactTitle = document.querySelector("[data-contact-title]");
      var contactDesc = document.querySelector("[data-contact-desc]");
      var contactBtn = document.querySelector("[data-contact-button]");
      if (contactTitle) {
        contactTitle.textContent = contactBlock.title || "Send a Message";
        if (isAdminPreview) contactTitle.setAttribute("data-inline-edit", "contact-title");
      }
      if (contactDesc) {
        contactDesc.textContent = contactBlock.description || "";
        if (isAdminPreview) contactDesc.setAttribute("data-inline-edit", "contact-description");
      }
      if (contactBtn) {
        contactBtn.textContent = contactBlock.buttonText || "Send Message";
        if (isAdminPreview) contactBtn.setAttribute("data-inline-edit", "contact-button");
      }
      if (isAdminPreview) {
        contactSection.appendChild(
          createHoverToolbar(
            [
              {
                label: contactBlock.enabled === false ? "Show" : "Hide",
                className: "hover-btn-link",
                onClick: function () {
                  sendAdminAction({ action: "toggle-contact" });
                }
              },
              {
                label: "Del",
                className: "hover-btn-delete",
                onClick: function () {
                  sendAdminAction({ action: "delete-contact" });
                }
              }
            ],
            "hover-toolbar-section"
          )
        );
      }
    }

    var newsBlock = data.newsletterBlock || {};
    var newsSection = document.querySelector("[data-newsletter-block]");
    if (newsSection) {
      newsSection.style.display = newsBlock.enabled === false ? "none" : "";
      var newsTitle = document.querySelector("[data-news-title]");
      var newsDesc = document.querySelector("[data-news-desc]");
      var newsBtn = document.querySelector("[data-news-button]");
      var newsInput = document.querySelector("#newsletterEmail");
      if (newsTitle) {
        newsTitle.textContent = newsBlock.title || "Stay Updated";
        if (isAdminPreview) newsTitle.setAttribute("data-inline-edit", "news-title");
      }
      if (newsDesc) {
        newsDesc.textContent = newsBlock.description || "";
        if (isAdminPreview) newsDesc.setAttribute("data-inline-edit", "news-description");
      }
      if (newsBtn) {
        newsBtn.textContent = newsBlock.buttonText || "Subscribe";
        if (isAdminPreview) newsBtn.setAttribute("data-inline-edit", "news-button");
      }
      if (newsInput) newsInput.placeholder = newsBlock.placeholder || "your@email.com";
      if (isAdminPreview) {
        newsSection.appendChild(
          createHoverToolbar(
            [
              {
                label: newsBlock.enabled === false ? "Show" : "Hide",
                className: "hover-btn-link",
                onClick: function () {
                  sendAdminAction({ action: "toggle-newsletter" });
                }
              },
              {
                label: "Del",
                className: "hover-btn-delete",
                onClick: function () {
                  sendAdminAction({ action: "delete-newsletter" });
                }
              }
            ],
            "hover-toolbar-section"
          )
        );
      }
    }

    var footerRoot = document.querySelector("[data-footer-links]");
    if (footerRoot) {
      footerRoot.innerHTML = "";
      (data.footerLinks || []).forEach(function (item, index) {
        var wrap = document.createElement("div");
        wrap.className = "footer-link-item editable-block";

        var a = document.createElement("a");
        a.href = item.href || "#";
        var label = document.createElement("span");
        label.textContent = item.label || "Link";
        if (isAdminPreview) {
          label.setAttribute("data-inline-edit", "footer-label");
          label.setAttribute("data-item-index", String(index));
        }
        a.appendChild(label);
        wrap.appendChild(a);

        if (isAdminPreview) {
          var footerHint = document.createElement("div");
          footerHint.className = "admin-link-hint";
          footerHint.textContent = item.href || "#";
          wrap.appendChild(footerHint);
          wrap.appendChild(
            createHoverToolbar(
              [
                {
                  label: "Edit",
                  className: "hover-btn-link",
                  onClick: function () {
                    sendAdminAction({ action: "edit-footer-link", itemIndex: index });
                  }
                },
                {
                  label: "Del",
                  className: "hover-btn-delete",
                  onClick: function () {
                    sendAdminAction({ action: "delete-footer-link", itemIndex: index });
                  }
                }
              ],
              "hover-toolbar-compact"
            )
          );
          enableDragReorder(wrap, "footer", index);
          a.addEventListener("click", function (event) {
            event.preventDefault();
          });
        }
        footerRoot.appendChild(wrap);
      });
      if (isAdminPreview) {
        var addFooterBtn = document.createElement("button");
        addFooterBtn.type = "button";
        addFooterBtn.className = "hover-btn hover-btn-add add-inline-btn";
        addFooterBtn.textContent = "+ Link";
        addFooterBtn.addEventListener("click", function () {
          sendAdminAction({ action: "add-footer-link" });
        });
        footerRoot.appendChild(addFooterBtn);
      }
    }

    var socialRoot = document.querySelector("[data-social-links]");
    if (socialRoot) {
      socialRoot.innerHTML = "";
      (data.socialLinks || []).forEach(function (social, index) {
        if (!isAdminPreview && social.enabled === false) return;
        var wrap = document.createElement("div");
        wrap.className = "social-item editable-block";

        var a = document.createElement("a");
        a.className =
          "social-icon social-" +
          (social.platform || "link") +
          (social.enabled === false ? " social-disabled" : "");
        a.href = social.url || "#";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = social.label || social.platform;
        a.textContent =
          social.platform === "youtube"
            ? "YouTube"
            : social.platform === "instagram"
              ? "Instagram"
              : social.platform === "facebook"
                ? "Facebook"
                : social.label || "Social";
        if (isAdminPreview) {
          a.textContent = social.label || a.textContent;
          a.setAttribute("data-inline-edit", "social-label");
          a.setAttribute("data-item-index", String(index));
        }
        wrap.appendChild(a);

        if (isAdminPreview) {
          wrap.appendChild(
            createHoverToolbar(
              [
                {
                  label: "Edit",
                  className: "hover-btn-link",
                  onClick: function () {
                    sendAdminAction({ action: "edit-social", itemIndex: index });
                  }
                },
                {
                  label: "Del",
                  className: "hover-btn-delete",
                  onClick: function () {
                    sendAdminAction({ action: "delete-social", itemIndex: index });
                  }
                }
              ],
              "hover-toolbar-compact"
            )
          );
          enableDragReorder(wrap, "social", index);
          a.addEventListener("click", function (event) {
            event.preventDefault();
          });
        }
        socialRoot.appendChild(wrap);
      });
      if (isAdminPreview) {
        var addSocialBtn = document.createElement("button");
        addSocialBtn.type = "button";
        addSocialBtn.className = "hover-btn hover-btn-add add-inline-btn";
        addSocialBtn.textContent = "+ Social";
        addSocialBtn.addEventListener("click", function () {
          sendAdminAction({ action: "add-social" });
        });
        socialRoot.appendChild(addSocialBtn);
      }
    }

    applyFooterColumnOrder(data);

    var adminLink = document.querySelector("[data-admin-link]");
    if (adminLink) {
      adminLink.textContent = uiLabels.adminPanel || "Admin Panel";
      if (isAdminPreview) adminLink.setAttribute("data-inline-edit", "admin-link-text");
    }

    var rights = document.querySelector("[data-rights]");
    if (rights) {
      rights.textContent = uiLabels.allRightsReserved || "All rights reserved.";
      if (isAdminPreview) rights.setAttribute("data-inline-edit", "rights-text");
    }

    var sidebarTitle = document.querySelector("[data-sidebar-title]");
    if (sidebarTitle) {
      sidebarTitle.textContent = uiLabels.sectionsMenu || "Sections";
      if (isAdminPreview) sidebarTitle.setAttribute("data-inline-edit", "sidebar-title");
    }

    var mobileMenuBtn = document.querySelector("#mobile-menu-btn");
    if (mobileMenuBtn && isAdminPreview) {
      mobileMenuBtn.setAttribute("data-free-text", "mobile-menu-label");
    }

    var logo = document.querySelector("[data-logo]");
    if (logo) {
      logo.src = data.logoUrl || "https://placehold.co/120x120/1e72ff/ffffff?text=HAI";
      logo.alt = localizedCompany + " logo";
      logo.onerror = function () {
        logo.onerror = null;
        logo.src = "https://placehold.co/120x120/1e72ff/ffffff?text=HAI";
      };
    }

    var hero = document.querySelector("[data-hero-image]");
    if (hero) {
      hero.src = data.heroImageUrl || "https://placehold.co/900x600/101a2e/bfd1ff?text=HAI+Software";
      hero.alt = localizedCompany + " visual";
      hero.onerror = function () {
        hero.onerror = null;
        hero.src = "https://placehold.co/900x600/101a2e/bfd1ff?text=HAI+Software";
      };
    }

    setThemeColor(data.primaryColor);

    var nav = document.querySelector("[data-nav]");
    var sectionsRoot = document.querySelector("[data-sections]");
    if (!nav || !sectionsRoot) return;

    nav.innerHTML = "";
    sectionsRoot.innerHTML = "";

    var visibleSections = data.sections.filter(function (section) {
      return section.enabled !== false;
    });
    if (!visibleSections.length) {
      return;
    }
    var hasCurrent = visibleSections.some(function (section) {
      return section.id === currentSectionId;
    });
    if (!hasCurrent) {
      currentSectionId = visibleSections[0].id;
    }

    visibleSections.forEach(function (section) {
        var link = document.createElement("a");
        link.href = "#" + section.id;
        link.setAttribute("data-section-hash", "1");
        var titleText = localizeSection(section, currentLanguage).title;
        if (isAdminPreview) {
          var titleSpan = document.createElement("span");
          titleSpan.textContent = titleText;
          titleSpan.setAttribute("data-inline-edit", "section-title");
          titleSpan.setAttribute("data-section-id", section.id);
          link.appendChild(titleSpan);
        } else {
          link.textContent = titleText;
        }
        if (section.id === currentSectionId) {
          link.classList.add("active");
        }
        if (isAdminPreview) {
          link.classList.add("editable-block");
          link.appendChild(
            createHoverToolbar([
              {
                label: "Delete",
                className: "hover-btn-delete",
                onClick: function () {
                  sendAdminAction({ action: "delete-section", sectionId: section.id });
                }
              }
            ])
          );
          var realIndex = data.sections.findIndex(function (item) {
            return item.id === section.id;
          });
          enableDragReorder(link, "sections", realIndex);
        }
        link.addEventListener("click", function (event) {
          if (event.target.closest(".hover-toolbar, .drag-handle")) return;
          if (event.target.closest("[contenteditable='true']")) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          currentSectionId = section.id;
          renderPage(data);
        });
        nav.appendChild(link);
      });

    var selectedSection = visibleSections.find(function (section) {
      return section.id === currentSectionId;
    });
    sectionsRoot.appendChild(renderSection(selectedSection, currentLanguage, uiLabels));

    applyFreeTextOverrides(data);

    if (window.HaiAdminLive && typeof window.HaiAdminLive.onRendered === "function") {
      window.HaiAdminLive.onRendered();
    }

    if (pendingCardFocus && pendingCardFocus.sectionId === currentSectionId) {
      var focusInfo = pendingCardFocus;
      pendingCardFocus = null;
      window.setTimeout(function () {
        focusCardInView(focusInfo.sectionId, focusInfo.cardIndex);
      }, 60);
    }
  }

  async function start() {
    var siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
    try {
      var localRaw = localStorage.getItem(LOCAL_CONTENT_KEY);
      if (localRaw) {
        siteData = dataApi.normalize(JSON.parse(localRaw));
      } else if (window.HaiFirebase && window.HaiFirebase.hasFirebaseConfig()) {
        siteData = await window.HaiFirebase.loadContent(
          dataApi.DEFAULT_SITE_DATA,
          dataApi.normalize
        );
      }
    } catch (error) {
      console.warn("Failed to load Firebase content:", error.message);
    }

    if (window.HaiAdminLive && window.HaiAdminLive.isActive) {
      siteData = window.HaiAdminLive.getData
        ? window.HaiAdminLive.getData() || siteData
        : siteData;
      // Prefer storage again after admin-live init load
      try {
        var adminRaw = localStorage.getItem(LOCAL_CONTENT_KEY);
        if (adminRaw) siteData = dataApi.normalize(JSON.parse(adminRaw));
      } catch (error) {}
    }

    currentLanguage = siteData.defaultLanguage || "en";

    function doRender(nextData) {
      if (nextData) siteData = nextData;
      renderPage(siteData);
    }

    if (window.HaiAdminLive && typeof window.HaiAdminLive.onReady === "function") {
      window.HaiAdminLive.onReady(siteData, doRender);
      siteData = window.HaiAdminLive.getData() || siteData;
    }

    wireSiteHashLinks();
    renderPage(siteData);
  }

  window.HaiSiteApp = {
    openSection: navigateToHash,
    getCurrentSectionId: function () {
      return currentSectionId;
    }
  };

  start();
})();
