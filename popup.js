// 获取书签树
chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
  // 获取文件夹选择器
  const folderSelect = document.getElementById('folderSelect');
  
  // 递归遍历书签树
  function traverseBookmarks(nodes) {
    nodes.forEach(node => {
      if (node.children) {
        // 如果是文件夹，添加到选择器
        const option = document.createElement('option');
        option.value = node.id;
        option.textContent = node.title;
        folderSelect.appendChild(option);
        
        // 递归处理子节点
        traverseBookmarks(node.children);
      }
    });
  }
  
  // 开始遍历
  traverseBookmarks(bookmarkTreeNodes);
});

// 替换按钮点击事件
document.getElementById('replaceBtn').addEventListener('click', () => {
  const folderId = document.getElementById('folderSelect').value;
  const findPattern = document.getElementById('findPattern').value;
  const replacePattern = document.getElementById('replacePattern').value;
  
  // 发送替换请求到background
  chrome.runtime.sendMessage({
    action: 'replaceUrls',
    findPattern: findPattern,
    replacePattern: replacePattern
  }, (response) => {
    if (response.success) {
      document.getElementById('message').textContent = 
        `替换完成！共替换了 ${response.replaceCount} 个书签`;
    } else {
      document.getElementById('message').textContent = 
        `替换失败：${response.error?.message || '未知错误'}，已替换 ${response.replaceCount} 个书签`;
    }
  });
});
