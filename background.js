// 获取所有书签
async function getAllBookmarks() {
  const bookmarks = await chrome.bookmarks.getTree();
  return flattenBookmarks(bookmarks);
}

// 将书签树结构扁平化
function flattenBookmarks(bookmarks) {
  let result = [];
  for (const node of bookmarks) {
    if (node.children) {
      result = result.concat(flattenBookmarks(node.children));
    } else if (node.url) {
      result.push(node);
    }
  }
  return result;
}

// 批量替换书签URL
async function batchReplaceUrls(findPattern, replacePattern) {
  const bookmarks = await getAllBookmarks();
  let replaceCount = 0;
  
  for (const bookmark of bookmarks) {
    if (bookmark.url.includes(findPattern)) {
      const newUrl = bookmark.url.replace(findPattern, replacePattern);
      await chrome.bookmarks.update(bookmark.id, { url: newUrl });
      replaceCount++;
    }
  }
  
  return replaceCount;
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'replaceUrls') {
    batchReplaceUrls(request.findPattern, request.replacePattern)
      .then(replaceCount => sendResponse({ 
        success: true,
        replaceCount: replaceCount
      }))
      .catch(error => sendResponse({ 
        success: false, 
        error,
        replaceCount: 0
      }));
    return true; // 保持消息通道开放
  }
});
