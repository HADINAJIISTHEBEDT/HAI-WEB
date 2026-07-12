(function () {
  "use strict";

  function hasFirebaseConfig() {
    var cfg = window.HaiFirebaseConfig || {};
    return !!(
      cfg.apiKey &&
      cfg.authDomain &&
      cfg.projectId &&
      cfg.storageBucket &&
      cfg.messagingSenderId &&
      cfg.appId &&
      cfg.apiKey !== "REPLACE_API_KEY"
    );
  }

  function ensureInit() {
    if (!window.firebase) {
      throw new Error("Firebase SDK not loaded.");
    }
    if (!hasFirebaseConfig()) {
      throw new Error("Firebase config missing in firebase-config.js.");
    }
    if (!firebase.apps.length) {
      firebase.initializeApp(window.HaiFirebaseConfig);
    }
    return {
      auth: firebase.auth(),
      db: firebase.firestore(),
      storage: firebase.storage()
    };
  }

  function docRef(db) {
    var collection = window.HaiFirebaseCollection || "siteContent";
    var doc = window.HaiFirebaseDocument || "main";
    return db.collection(collection).doc(doc);
  }

  async function loadContent(defaultData, normalizeData) {
    var instance = ensureInit();
    var snapshot = await docRef(instance.db).get();
    if (!snapshot.exists) {
      return normalizeData(defaultData);
    }
    var data = snapshot.data() || {};
    return normalizeData(data);
  }

  async function saveContent(data, normalizeData) {
    var instance = ensureInit();
    var normalized = normalizeData(data);
    await docRef(instance.db).set({
      companyName: normalized.companyName,
      tagline: normalized.tagline,
      logoUrl: normalized.logoUrl,
      heroImageUrl: normalized.heroImageUrl,
      primaryColor: normalized.primaryColor,
      sections: normalized.sections,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return normalized;
  }

  async function uploadImage(file, folderName) {
    var instance = ensureInit();
    var safeName = Date.now() + "-" + (file.name || "upload").replace(/\s+/g, "-");
    var path = (folderName || "site-assets") + "/" + safeName;
    var ref = instance.storage.ref(path);
    await ref.put(file);
    return ref.getDownloadURL();
  }

  async function signIn(email, password) {
    var instance = ensureInit();
    return instance.auth.signInWithEmailAndPassword(email, password);
  }

  async function signOut() {
    var instance = ensureInit();
    return instance.auth.signOut();
  }

  function onAuthStateChanged(callback) {
    var instance = ensureInit();
    return instance.auth.onAuthStateChanged(callback);
  }

  window.HaiFirebase = {
    hasFirebaseConfig: hasFirebaseConfig,
    ensureInit: ensureInit,
    loadContent: loadContent,
    saveContent: saveContent,
    uploadImage: uploadImage,
    signIn: signIn,
    signOut: signOut,
    onAuthStateChanged: onAuthStateChanged
  };
})();
