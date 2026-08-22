import { icon } from './icons.js';
import { state, dom } from './core/state.js';
import { api } from './core/api.js';
import { loadAll, loadFonts, loadMedia } from './core/data.js';
import { show, render, toggleGroup } from './core/router.js';
import { openMediaModal, closeMediaModal, selectMediaFromModal, uploadMediaFromModal, toggleMediaModalGalleryMode, confirmMediaSelection } from './components/media-modal.js';
import { openProjectImagePicker, removeProjectImage, reorderProjectImage, newProject, editProject, duplicateProject, deleteProject, toggleProjectCat, saveProject, onTemplateChange, onVideoSourceChange, openCoverPickerModal as openProjectCoverPickerModal, selectCover as selectProjectCover } from './views/projects.js';
import { openPostImagePicker, removePostImage, reorderPostImage, newPost, editPost, duplicatePost, deletePost, savePost, togglePostCat, onPostTemplateChange, onPostVideoSourceChange, openCoverPickerModal as openPostCoverPickerModal, selectCover as selectPostCover } from './views/posts.js';
import { openCatModal, saveCat, deleteCat, switchCatType } from './views/categories.js';
import { addExp, renderExp, addEdu, renderEdu, addLink, renderLinks, saveResume, cancelResume } from './views/resume.js';
import { uploadMedia, deleteMedia, openLightbox } from './views/media.js';
import { saveSettings } from './views/settings.js';
import { saveTheme, onThemeModeSelect, onAutoBaseColorChange, copyToManualAndSwitch, syncCustomColors } from './views/theme.js';
import { openFontModal, toggleFontSourceModal, onFontFileSelected, handleFontDrop, saveFontModal, deleteSiteFont, updateTypoAuto } from './views/typography.js';
import { startPublish, renderPublish, startLocalTest, updateUrlConfig, saveUrlConfig } from './views/publish.js';
import { newPage, editPage, deletePage, savePage } from './views/pages.js';
import { addMenuItem, deleteMenuItem, saveMenu, saveMenuAuto, handleDragStartMenu, handleDragOverMenu, handleDropMenu, handleDragEndMenu, toggleMenuVisibility } from './views/menu.js';
import { saveHero, cancelHero, handleDragStartHome, handleDragOverHome, handleDropHome, handleDragEndHome } from './views/hero.js';
import { renderUpdate, checkUpdate, startUpdate } from './views/update.js';
import { renderPreview, startPreview, cancelPreview, openPreviewTab } from './views/preview.js';

// Expose router functions for inline HTML handlers
window.show = show;
window.render = render;
window.toggleGroup = toggleGroup;

// Expose preview handlers for inline HTML
window.renderPreview = renderPreview;
window.startPreview = startPreview;
window.cancelPreview = cancelPreview;
window.openPreviewTab = openPreviewTab;

// Expose other components needed in HTML or dynamically generated strings
window.openMediaModal = openMediaModal;
window.toggleMediaModalGalleryMode = toggleMediaModalGalleryMode;
window.confirmMediaSelection = confirmMediaSelection;
window.closeMediaModal = closeMediaModal;
window.selectMediaFromModal = selectMediaFromModal;
window.uploadMediaFromModal = uploadMediaFromModal;

window.newProject = newProject;
window.editProject = editProject;
window.duplicateProject = duplicateProject;
window.deleteProject = deleteProject;
window.toggleProjectCat = toggleProjectCat;
window.saveProject = saveProject;
window.onTemplateChange = onTemplateChange;
window.onVideoSourceChange = onVideoSourceChange;


window.newPost = newPost;
window.editPost = editPost;
window.duplicatePost = duplicatePost;
window.deletePost = deletePost;
window.savePost = savePost;

window.openCatModal = openCatModal;
window.saveCat = saveCat;
window.deleteCat = deleteCat;

window.addExp = addExp;
window.renderExp = renderExp;
window.addEdu = addEdu;
window.renderEdu = renderEdu;
window.addLink = addLink;
window.renderLinks = renderLinks;
window.saveResume = saveResume;
window.cancelResume = cancelResume;

window.uploadMedia = uploadMedia;
window.deleteMedia = deleteMedia;
window.openLightbox = openLightbox;

window.saveSettings = saveSettings;

window.saveTheme = saveTheme;
window.onThemeModeSelect = onThemeModeSelect;
window.onAutoBaseColorChange = onAutoBaseColorChange;
window.copyToManualAndSwitch = copyToManualAndSwitch;
window.syncCustomColors = syncCustomColors;

window.openFontModal = openFontModal;
window.toggleFontSourceModal = toggleFontSourceModal;
window.onFontFileSelected = onFontFileSelected;
window.handleFontDrop = handleFontDrop;
window.saveFontModal = saveFontModal;
window.deleteSiteFont = deleteSiteFont;
window.updateTypoAuto = updateTypoAuto;

window.startPublish = startPublish;
window.renderPublish = renderPublish;
window.startLocalTest = startLocalTest;
window.updateUrlConfig = updateUrlConfig;
window.saveUrlConfig = saveUrlConfig;

window.newPage = newPage;
window.editPage = editPage;
window.deletePage = deletePage;
window.savePage = savePage;

window.addMenuItem = addMenuItem;
window.deleteMenuItem = deleteMenuItem;
window.toggleMenuVisibility = toggleMenuVisibility;
window.handleDragStartMenu = handleDragStartMenu;
window.handleDragOverMenu = handleDragOverMenu;
window.handleDropMenu = handleDropMenu;
window.handleDragEndMenu = handleDragEndMenu;

window.saveHero = saveHero;

window.checkUpdate = checkUpdate;
window.startUpdate = startUpdate;

window.handleDragStartHome = handleDragStartHome;
window.handleDragOverHome = handleDragOverHome;
window.handleDropHome = handleDropHome;
window.handleDragEndHome = handleDragEndHome;

window.cancelHero = cancelHero;

window.state = state; // Useful for debugging

// Initialize the app
loadAll();
window.saveMenu = saveMenu;
window.saveMenuAuto = saveMenuAuto;
window.icon = icon;
window.toggleAdminTheme = window.toggleAdminTheme || function() {};


window.toggleProjectCat = toggleProjectCat;
window.togglePostCat = togglePostCat;
window.onPostTemplateChange = onPostTemplateChange;
window.onPostVideoSourceChange = onPostVideoSourceChange;
window.openPostImagePicker = openPostImagePicker;
window.removePostImage = removePostImage;
window.reorderPostImage = reorderPostImage;
window.removeProjectImage = removeProjectImage;
window.reorderProjectImage = reorderProjectImage;


window.openProjectCoverPickerModal = openProjectCoverPickerModal;
window.openPostCoverPickerModal = openPostCoverPickerModal;

window.openProjectImagePicker = openProjectImagePicker;
window.switchCatType = switchCatType;
