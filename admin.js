(function () {
  "use strict";

  var dataApi = window.HaiSiteData;
  var firebaseApi = window.HaiFirebase;
  var siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
  var currentUser = null;

  var form = document.querySelector("#site-form");
  var sectionsRoot = document.querySelector("#sections-editor");
  var statusBox = document.querySelector("#status");
  var preview = document.querySelector("#preview-frame");
  var editorShell = document.querySelector("#editor-shell");
  var loginButton = document.querySelector("#login-btn");
  var logoutButton = document.querySelector("#logout-btn");
  var adminEmailInput = document.querySelector("#adminEmail");
  var adminPasswordInput = document.querySelector("#adminPassword");
  var uploadLogoButton = document.querySelector("#upload-logo");
  var uploadHeroButton = document.querySelector("#upload-hero");
  var logoFileInput = document.querySelector("#logoFile");
  var heroFileInput = document.querySelector("#heroFile");
  var cfgApiKey = document.querySelector("#cfgApiKey");
  var cfgAuthDomain = document.querySelector("#cfgAuthDomain");
  var cfgProjectId = document.querySelector("#cfgProjectId");
  var cfgStorageBucket = document.querySelector("#cfgStorageBucket");
  var cfgMessagingSenderId = document.querySelector("#cfgMessagingSenderId");
  var cfgAppId = document.querySelector("#cfgAppId");
  var saveFirebaseConfigButton = document.querySelector("#save-firebase-config");
  var clearFirebaseConfigButton = document.querySelector("#clear-firebase-config");
  var adminLangSwitch = document.querySelector("#admin-lang-switch");
  var adminUiLanguage = localStorage.getItem("hai_admin_ui_lang") || "en";
  var UI = {
    en: {
      adminBrand: "HAI SOFTWARE INTELLIGENCE - Admin",
      openMainSite: "Open Main Site",
      websiteEditor: "Website Editor",
      adminLogin: "Admin Login",
      email: "Email",
      password: "Password",
      emailPlaceholder: "admin@yourdomain.com",
      passwordPlaceholder: "Enter password",
      signIn: "Sign In",
      signOut: "Sign Out",
      companyName: "Company Name",
      primaryColor: "Primary Color (hex)",
      defaultWebsiteLanguage: "Default Website Language",
      tagline: "Tagline",
      logoUrl: "Logo URL",
      uploadLogo: "Upload Logo",
      mainPageImageUrl: "Main Page Image URL",
      uploadMainImage: "Upload Main Image",
      saveChanges: "Save Changes",
      refreshPreview: "Refresh Preview",
      resetDefault: "Reset Default",
      addNewSection: "Add New Section",
      exportJson: "Export JSON",
      sections: "Sections",
      livePreview: "Live Preview",
      statusSignInPrompt: "Please sign in to edit website content.",
      statusSignedInAs: "Signed in as {email}",
      statusLoadedFromFirebase: "Loaded content from Firebase.",
      statusCouldNotLoad: "Could not load Firebase content: {error}",
      statusSaved: "Saved to Firebase successfully.",
      statusSaveFailed: "Save failed: {error}",
      statusChooseImage: "Please choose an image file first.",
      statusUploadingImage: "Uploading image...",
      statusUploadDone: "Upload complete. Remember to click Save Changes.",
      statusUploadFailed: "Upload failed: {error}",
      statusEnterCredentials: "Enter admin email and password.",
      statusLoginFailed: "Login failed: {error}",
      statusSignedOut: "Signed out.",
      statusSignOutFailed: "Sign out failed: {error}",
      statusResetDone: "Reset complete. Click Save Changes to push defaults.",
      statusPreviewRefreshed: "Preview refreshed.",
      statusExported: "Exported JSON file.",
      statusImported: "Imported JSON. Click Save Changes to push Firebase.",
      statusImportFailed: "Import failed: Invalid JSON file.",
      statusFirebaseNotConfigured: "Firebase is not configured yet. Use the Firebase Configuration form above, then save.",
      confirmReset: "Reset all content to default values?",
      sectionId: "Section ID",
      sectionTitle: "Section Title",
      sectionType: "Section Type",
      sectionVisibility: "Section Visibility",
      sectionDescription: "Section Description",
      items: "Items",
      itemTitle: "Item Title",
      itemDescription: "Item Description",
      linkUrl: "Link URL",
      videoUrl: "Video URL",
      addItem: "Add Item",
      removeItem: "Remove Item",
      removeSection: "Remove Section",
      enabled: "Enabled",
      disabled: "Disabled",
      newSectionTitle: "New Section",
      newSectionDescription: "Describe this section.",
      newItemTitle: "New Item",
      firebaseConfigTitle: "Firebase Configuration",
      firebaseConfigHint: "Paste your Firebase Web App config once, save it, then reload.",
      cfgApiKey: "API Key",
      cfgAuthDomain: "Auth Domain",
      cfgProjectId: "Project ID",
      cfgStorageBucket: "Storage Bucket",
      cfgMessagingSenderId: "Messaging Sender ID",
      cfgAppId: "App ID",
      saveFirebaseConfig: "Save Firebase Config",
      clearFirebaseConfig: "Clear Config",
      statusConfigSaved: "Firebase config saved. Reloading...",
      statusConfigCleared: "Firebase config cleared. Reloading...",
      statusConfigInvalid: "Please fill all Firebase config fields.",
      statusConfigSaveFailed: "Could not save Firebase config: {error}"
    },
    ar: {
      adminBrand: "هاي للذكاء البرمجي - لوحة الادارة",
      openMainSite: "فتح الموقع الرئيسي",
      websiteEditor: "محرر الموقع",
      adminLogin: "تسجيل دخول الادمن",
      email: "البريد الالكتروني",
      password: "كلمة المرور",
      emailPlaceholder: "admin@yourdomain.com",
      passwordPlaceholder: "ادخل كلمة المرور",
      signIn: "تسجيل الدخول",
      signOut: "تسجيل الخروج",
      companyName: "اسم الشركة",
      primaryColor: "اللون الرئيسي",
      defaultWebsiteLanguage: "لغة الموقع الافتراضية",
      tagline: "الوصف المختصر",
      logoUrl: "رابط الشعار",
      uploadLogo: "رفع الشعار",
      mainPageImageUrl: "رابط صورة الصفحة الرئيسية",
      uploadMainImage: "رفع الصورة الرئيسية",
      saveChanges: "حفظ التغييرات",
      refreshPreview: "تحديث المعاينة",
      resetDefault: "اعادة الافتراضي",
      addNewSection: "اضافة قسم جديد",
      exportJson: "تصدير JSON",
      sections: "الاقسام",
      livePreview: "معاينة مباشرة",
      statusSignInPrompt: "سجل الدخول اولا لتعديل محتوى الموقع.",
      statusSignedInAs: "تم تسجيل الدخول باسم {email}",
      statusLoadedFromFirebase: "تم تحميل المحتوى من Firebase.",
      statusCouldNotLoad: "تعذر تحميل المحتوى: {error}",
      statusSaved: "تم الحفظ في Firebase بنجاح.",
      statusSaveFailed: "فشل الحفظ: {error}",
      statusChooseImage: "يرجى اختيار صورة اولا.",
      statusUploadingImage: "جاري رفع الصورة...",
      statusUploadDone: "اكتمل الرفع. لا تنس الضغط على حفظ التغييرات.",
      statusUploadFailed: "فشل رفع الصورة: {error}",
      statusEnterCredentials: "ادخل البريد وكلمة المرور.",
      statusLoginFailed: "فشل تسجيل الدخول: {error}",
      statusSignedOut: "تم تسجيل الخروج.",
      statusSignOutFailed: "فشل تسجيل الخروج: {error}",
      statusResetDone: "اكتملت الاعادة. اضغط حفظ التغييرات لرفع القيم الافتراضية.",
      statusPreviewRefreshed: "تم تحديث المعاينة.",
      statusExported: "تم تصدير ملف JSON.",
      statusImported: "تم استيراد JSON. اضغط حفظ التغييرات للرفع الى Firebase.",
      statusImportFailed: "فشل الاستيراد: ملف JSON غير صالح.",
      statusFirebaseNotConfigured: "Firebase غير مهيأ بعد. استخدم نموذج اعدادات Firebase اعلاه ثم احفظ.",
      confirmReset: "هل تريد اعادة كل المحتوى الى القيم الافتراضية؟",
      sectionId: "معرف القسم",
      sectionTitle: "عنوان القسم",
      sectionType: "نوع القسم",
      sectionVisibility: "ظهور القسم",
      sectionDescription: "وصف القسم",
      items: "العناصر",
      itemTitle: "عنوان العنصر",
      itemDescription: "وصف العنصر",
      linkUrl: "رابط",
      videoUrl: "رابط الفيديو",
      addItem: "اضافة عنصر",
      removeItem: "حذف العنصر",
      removeSection: "حذف القسم",
      enabled: "مفعل",
      disabled: "معطل",
      newSectionTitle: "قسم جديد",
      newSectionDescription: "اكتب وصف القسم.",
      newItemTitle: "عنصر جديد",
      firebaseConfigTitle: "اعدادات Firebase",
      firebaseConfigHint: "الصق اعدادات تطبيق الويب مرة واحدة ثم احفظ واعادة تحميل.",
      cfgApiKey: "API Key",
      cfgAuthDomain: "Auth Domain",
      cfgProjectId: "Project ID",
      cfgStorageBucket: "Storage Bucket",
      cfgMessagingSenderId: "Messaging Sender ID",
      cfgAppId: "App ID",
      saveFirebaseConfig: "حفظ اعدادات Firebase",
      clearFirebaseConfig: "مسح الاعدادات",
      statusConfigSaved: "تم حفظ الاعدادات. جاري اعادة التحميل...",
      statusConfigCleared: "تم مسح الاعدادات. جاري اعادة التحميل...",
      statusConfigInvalid: "يرجى تعبئة كل حقول اعدادات Firebase.",
      statusConfigSaveFailed: "تعذر حفظ الاعدادات: {error}"
    },
    tr: {
      adminBrand: "HAI YAZILIM ZEKASI - Yonetim",
      openMainSite: "Ana Siteyi Ac",
      websiteEditor: "Web Site Editoru",
      adminLogin: "Yonetici Girisi",
      email: "E-posta",
      password: "Sifre",
      emailPlaceholder: "admin@yourdomain.com",
      passwordPlaceholder: "Sifreyi girin",
      signIn: "Giris Yap",
      signOut: "Cikis Yap",
      companyName: "Sirket Adi",
      primaryColor: "Ana Renk (hex)",
      defaultWebsiteLanguage: "Varsayilan Site Dili",
      tagline: "Slogan",
      logoUrl: "Logo URL",
      uploadLogo: "Logo Yukle",
      mainPageImageUrl: "Ana Sayfa Gorsel URL",
      uploadMainImage: "Ana Gorsel Yukle",
      saveChanges: "Degisiklikleri Kaydet",
      refreshPreview: "Onizlemeyi Yenile",
      resetDefault: "Varsayilana Don",
      addNewSection: "Yeni Bolum Ekle",
      exportJson: "JSON Disa Aktar",
      sections: "Bolumler",
      livePreview: "Canli Onizleme",
      statusSignInPrompt: "Site icerigini duzenlemek icin giris yapin.",
      statusSignedInAs: "{email} olarak giris yapildi",
      statusLoadedFromFirebase: "Icerik Firebase'den yuklendi.",
      statusCouldNotLoad: "Icerik yuklenemedi: {error}",
      statusSaved: "Firebase'e basariyla kaydedildi.",
      statusSaveFailed: "Kaydetme hatasi: {error}",
      statusChooseImage: "Lutfen once bir gorsel secin.",
      statusUploadingImage: "Gorsel yukleniyor...",
      statusUploadDone: "Yukleme tamamlandi. Degisiklikleri Kaydet'e basin.",
      statusUploadFailed: "Yukleme hatasi: {error}",
      statusEnterCredentials: "Yonetici e-posta ve sifresini girin.",
      statusLoginFailed: "Giris hatasi: {error}",
      statusSignedOut: "Cikis yapildi.",
      statusSignOutFailed: "Cikis hatasi: {error}",
      statusResetDone: "Sifirlama tamamlandi. Varsayilani Firebase'e kaydetmek icin Kaydet'e basin.",
      statusPreviewRefreshed: "Onizleme yenilendi.",
      statusExported: "JSON dosyasi disa aktarildi.",
      statusImported: "JSON ice aktarildi. Firebase'e gondermek icin Kaydet'e basin.",
      statusImportFailed: "Ice aktarma hatasi: Gecersiz JSON dosyasi.",
      statusFirebaseNotConfigured: "Firebase henuz ayarlanmamis. Yukaridaki Firebase Yapilandirmasi formunu doldurup kaydedin.",
      confirmReset: "Tum icerik varsayilan degere sifirlansin mi?",
      sectionId: "Bolum ID",
      sectionTitle: "Bolum Basligi",
      sectionType: "Bolum Turu",
      sectionVisibility: "Bolum Gorunurlugu",
      sectionDescription: "Bolum Aciklamasi",
      items: "Ogeler",
      itemTitle: "Oge Basligi",
      itemDescription: "Oge Aciklamasi",
      linkUrl: "Baglanti URL",
      videoUrl: "Video URL",
      addItem: "Oge Ekle",
      removeItem: "Oge Sil",
      removeSection: "Bolumu Sil",
      enabled: "Etkin",
      disabled: "Devre Disi",
      newSectionTitle: "Yeni Bolum",
      newSectionDescription: "Bu bolumu aciklayin.",
      newItemTitle: "Yeni Oge",
      firebaseConfigTitle: "Firebase Yapilandirmasi",
      firebaseConfigHint: "Firebase web uygulama ayarlarini bir kez yapistirip kaydedin, sonra sayfa yenilensin.",
      cfgApiKey: "API Key",
      cfgAuthDomain: "Auth Domain",
      cfgProjectId: "Project ID",
      cfgStorageBucket: "Storage Bucket",
      cfgMessagingSenderId: "Messaging Sender ID",
      cfgAppId: "App ID",
      saveFirebaseConfig: "Firebase Ayarlarini Kaydet",
      clearFirebaseConfig: "Ayarlari Temizle",
      statusConfigSaved: "Firebase ayarlari kaydedildi. Yeniden yukleniyor...",
      statusConfigCleared: "Firebase ayarlari temizlendi. Yeniden yukleniyor...",
      statusConfigInvalid: "Lutfen tum Firebase ayar alanlarini doldurun.",
      statusConfigSaveFailed: "Firebase ayarlari kaydedilemedi: {error}"
    }
  };
  if (!UI[adminUiLanguage]) {
    adminUiLanguage = "en";
  }

  function t(key, vars) {
    var table = UI[adminUiLanguage] || UI.en;
    var text = table[key] || UI.en[key] || key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, function (_, token) {
      return vars[token] == null ? "" : String(vars[token]);
    });
  }
  function applyAdminLanguage() {
    document.documentElement.lang = adminUiLanguage === "ar" ? "ar" : adminUiLanguage === "tr" ? "tr" : "en";
    document.documentElement.dir = adminUiLanguage === "ar" ? "rtl" : "ltr";
    document.title = t("adminBrand");
    if (adminLangSwitch) {
      adminLangSwitch.value = adminUiLanguage;
    }
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    renderSectionsEditor();
  }

  function notify(message, isError) {
    statusBox.textContent = message;
    statusBox.style.color = isError ? "#ff8ea6" : "#9bd0ff";
  }

  function getFirebaseConfigFromInputs() {
    return {
      apiKey: (cfgApiKey.value || "").trim(),
      authDomain: (cfgAuthDomain.value || "").trim(),
      projectId: (cfgProjectId.value || "").trim(),
      storageBucket: (cfgStorageBucket.value || "").trim(),
      messagingSenderId: (cfgMessagingSenderId.value || "").trim(),
      appId: (cfgAppId.value || "").trim()
    };
  }

  function fillFirebaseConfigInputs(config) {
    var cfg = config || window.HaiFirebaseConfig || {};
    cfgApiKey.value = cfg.apiKey || "";
    cfgAuthDomain.value = cfg.authDomain || "";
    cfgProjectId.value = cfg.projectId || "";
    cfgStorageBucket.value = cfg.storageBucket || "";
    cfgMessagingSenderId.value = cfg.messagingSenderId || "";
    cfgAppId.value = cfg.appId || "";
  }

  function setEditorEnabled(enabled) {
    editorShell.style.display = enabled ? "block" : "none";
    logoutButton.disabled = !enabled;
  }

  function applyBrandPreview() {
    var adminLogo = document.querySelector("[data-logo]");
    if (adminLogo) {
      adminLogo.src = siteData.logoUrl;
      adminLogo.alt = siteData.companyName + " logo";
    }
    document.documentElement.style.setProperty("--primary", siteData.primaryColor || "#1e72ff");
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
    options.forEach(function (optionValue) {
      var option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      if (value === optionValue) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener("change", function () {
      onChange(select.value);
    });
    wrap.appendChild(select);
    return wrap;
  }

  function createToggle(labelText, checked, onChange) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var label = document.createElement("label");
    label.textContent = labelText;
    wrap.appendChild(label);
    var select = document.createElement("select");
    ["true", "false"].forEach(function (flag) {
      var option = document.createElement("option");
      option.value = flag;
      option.textContent = flag === "true" ? t("enabled") : t("disabled");
      option.selected = String(checked) === flag;
      select.appendChild(option);
    });
    select.addEventListener("change", function () {
      onChange(select.value === "true");
    });
    wrap.appendChild(select);
    return wrap;
  }

  function createItemEditor(section, item, itemIndex) {
    var box = document.createElement("div");
    box.className = "item-editor";

    box.appendChild(
      createField(t("itemTitle"), item.title || "", function (value) {
        item.title = value;
      })
    );

    box.appendChild(
      createField(t("itemDescription"), item.description || "", function (value) {
        item.description = value;
      }, "textarea")
    );

    box.appendChild(
      createField(t("linkUrl"), item.url || "", function (value) {
        item.url = value;
      })
    );

    box.appendChild(
      createField(t("videoUrl"), item.videoUrl || "", function (value) {
        item.videoUrl = value;
      })
    );

    var actions = document.createElement("div");
    actions.className = "mini-actions";

    var remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn-danger";
    remove.textContent = t("removeItem");
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
      createField(t("sectionId"), section.id, function (value) {
        section.id = value.replace(/\s+/g, "-").toLowerCase() || dataApi.createId("section");
      })
    );
    block.appendChild(
      createField(t("sectionTitle"), section.title, function (value) {
        section.title = value;
      })
    );
    block.appendChild(
      createSelect(
        t("sectionType"),
        section.type,
        [
          "about",
          "services",
          "apps",
          "links",
          "videos",
          "contact",
          "custom",
          "team",
          "portfolio",
          "testimonials",
          "pricing"
        ],
        function (value) {
          section.type = value;
        }
      )
    );
    block.appendChild(
      createToggle(t("sectionVisibility"), section.enabled !== false, function (value) {
        section.enabled = value;
      })
    );
    block.appendChild(
      createField(t("sectionDescription"), section.description || "", function (value) {
        section.description = value;
      }, "textarea")
    );

    var itemTitle = document.createElement("h4");
    itemTitle.textContent = t("items");
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
    addItem.textContent = t("addItem");
    addItem.addEventListener("click", function () {
      section.items.push({
        title: t("newItemTitle"),
        description: "",
        url: "",
        videoUrl: ""
      });
      renderSectionsEditor();
    });
    itemActions.appendChild(addItem);

    var removeSection = document.createElement("button");
    removeSection.type = "button";
    removeSection.className = "btn-danger";
    removeSection.textContent = t("removeSection");
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
    applyBrandPreview();
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
    preview.src = "./index.html?t=" + Date.now();
  }

  async function loadFromFirebase() {
    try {
      siteData = await firebaseApi.loadContent(dataApi.DEFAULT_SITE_DATA, dataApi.normalize);
      fillGlobalFields();
      renderSectionsEditor();
      reloadPreview();
      notify(t("statusLoadedFromFirebase"));
    } catch (error) {
      notify(t("statusCouldNotLoad", { error: error.message }), true);
    }
  }

  async function saveToFirebase() {
    try {
      syncFormToData();
      siteData = await firebaseApi.saveContent(siteData, dataApi.normalize);
      fillGlobalFields();
      reloadPreview();
      notify(t("statusSaved"));
    } catch (error) {
      notify(t("statusSaveFailed", { error: error.message }), true);
    }
  }

  async function uploadImage(fileInput, targetField, folderName) {
    var file = fileInput.files && fileInput.files[0];
    if (!file) {
      notify(t("statusChooseImage"), true);
      return;
    }

    try {
      notify(t("statusUploadingImage"));
      var url = await firebaseApi.uploadImage(file, folderName);
      form[targetField].value = url;
      syncFormToData();
      applyBrandPreview();
      reloadPreview();
      notify(t("statusUploadDone"));
    } catch (error) {
      notify(t("statusUploadFailed", { error: error.message }), true);
    }
  }

  async function handleLogin() {
    var email = adminEmailInput.value.trim();
    var password = adminPasswordInput.value;
    if (!email || !password) {
      notify(t("statusEnterCredentials"), true);
      return;
    }

    try {
      await firebaseApi.signIn(email, password);
      adminPasswordInput.value = "";
    } catch (error) {
      notify(t("statusLoginFailed", { error: error.message }), true);
    }
  }

  async function handleLogout() {
    try {
      await firebaseApi.signOut();
      notify(t("statusSignedOut"));
    } catch (error) {
      notify(t("statusSignOutFailed", { error: error.message }), true);
    }
  }

  document.querySelector("#add-section").addEventListener("click", function () {
    siteData.sections.push({
      id: dataApi.createId("section"),
      type: "custom",
      title: t("newSectionTitle"),
      description: t("newSectionDescription"),
      enabled: true,
      items: []
    });
    renderSectionsEditor();
  });

  document.querySelector("#save-site").addEventListener("click", function () {
    saveToFirebase();
  });

  document.querySelector("#reset-site").addEventListener("click", function () {
    if (!window.confirm(t("confirmReset"))) return;
    siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
    fillGlobalFields();
    renderSectionsEditor();
    reloadPreview();
    notify(t("statusResetDone"));
  });

  document.querySelector("#preview-site").addEventListener("click", function () {
    syncFormToData();
    fillGlobalFields();
    reloadPreview();
    notify(t("statusPreviewRefreshed"));
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
    notify(t("statusExported"));
  });

  document.querySelector("#import-json").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var imported = JSON.parse(reader.result);
        siteData = dataApi.normalize(imported);
        fillGlobalFields();
        renderSectionsEditor();
        reloadPreview();
        notify(t("statusImported"));
      } catch (error) {
        notify(t("statusImportFailed"), true);
      }
    };
    reader.readAsText(file);
  });

  loginButton.addEventListener("click", handleLogin);
  logoutButton.addEventListener("click", handleLogout);
  uploadLogoButton.addEventListener("click", function () {
    uploadImage(logoFileInput, "logoUrl", "logos");
  });
  uploadHeroButton.addEventListener("click", function () {
    uploadImage(heroFileInput, "heroImageUrl", "hero");
  });
  saveFirebaseConfigButton.addEventListener("click", function () {
    try {
      var config = getFirebaseConfigFromInputs();
      var allFilled = Object.keys(config).every(function (key) {
        return !!config[key];
      });
      if (!allFilled) {
        notify(t("statusConfigInvalid"), true);
        return;
      }
      localStorage.setItem("hai_firebase_config", JSON.stringify(config));
      notify(t("statusConfigSaved"));
      setTimeout(function () {
        location.reload();
      }, 600);
    } catch (error) {
      notify(t("statusConfigSaveFailed", { error: error.message }), true);
    }
  });
  clearFirebaseConfigButton.addEventListener("click", function () {
    localStorage.removeItem("hai_firebase_config");
    notify(t("statusConfigCleared"));
    setTimeout(function () {
      location.reload();
    }, 500);
  });
  if (adminLangSwitch) {
    adminLangSwitch.addEventListener("change", function () {
      adminUiLanguage = adminLangSwitch.value;
      localStorage.setItem("hai_admin_ui_lang", adminUiLanguage);
      applyAdminLanguage();
      if (currentUser) {
        notify(t("statusSignedInAs", { email: currentUser.email }));
      } else {
        notify(t("statusSignInPrompt"));
      }
    });
  }

  if (!firebaseApi || !firebaseApi.hasFirebaseConfig()) {
    setEditorEnabled(false);
    applyAdminLanguage();
    fillFirebaseConfigInputs(window.HaiFirebaseConfig);
    notify(t("statusFirebaseNotConfigured"), true);
    return;
  }
  applyAdminLanguage();
  fillFirebaseConfigInputs(window.HaiFirebaseConfig);

  firebaseApi.onAuthStateChanged(function (user) {
    currentUser = user || null;
    if (currentUser) {
      setEditorEnabled(true);
      notify(t("statusSignedInAs", { email: currentUser.email }));
      loadFromFirebase();
    } else {
      setEditorEnabled(false);
      siteData = dataApi.clone(dataApi.DEFAULT_SITE_DATA);
      fillGlobalFields();
      renderSectionsEditor();
      reloadPreview();
      notify(t("statusSignInPrompt"));
    }
  });
})();
