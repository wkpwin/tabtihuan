  // 获取书签树
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    // 获取文件夹选择器
    const folderSelect = document.getElementById('folderSelect');
    if (!folderSelect) {
      console.error('Folder select element not found');
      return;
    }
    
    // 清空现有选项
    folderSelect.innerHTML = '';
    
    // 添加默认选项
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '请选择文件夹';
    folderSelect.appendChild(defaultOption);
  
  // 检索指定文件夹的书签
  function retrieveBookmarks(folderId) {
    chrome.bookmarks.getChildren(folderId, function(bookmarks) {
      console.log('Bookmarks:', bookmarks);
      
      if (!bookmarks || bookmarks.length === 0) {
        console.log('No bookmarks found in this folder');
        return;
      }
      
      const urls = bookmarks
        .filter(b => b.url)
        .map(b => b.url);
      
      console.log('URLs:', urls);
      
      // 获取文件夹名
      chrome.bookmarks.get(folderId, function(folder) {
        const folderName = folder[0]?.title || '';
        
      // 提取公共字段
      const commonPattern = findCommonUrlPattern(urls);
      console.log('Common pattern:', commonPattern);
      console.log('URLs:', urls);
      
      // 设置默认值：优先使用公共字段，否则使用文件夹名
      const defaultValue = commonPattern || folderName;
      console.log('Setting default value:', defaultValue);
      document.getElementById('findPatternInput').value = defaultValue;
      });
    });
  }

  // 从存储中获取上次选择的文件夹
  chrome.storage.local.get(['lastSelectedFolder'], function(result) {
    if (result.lastSelectedFolder) {
      folderSelect.value = result.lastSelectedFolder;
      // 立即检索书签
      retrieveBookmarks(result.lastSelectedFolder);
    }
  });

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

// 文件夹选择变化事件
document.getElementById('folderSelect').addEventListener('change', function() {
  const selectedFolderId = this.value;
  
  // 保存选择的文件夹
  chrome.storage.local.set({ lastSelectedFolder: selectedFolderId });
  
  // 获取该文件夹下的所有URL
  chrome.bookmarks.getChildren(selectedFolderId, function(bookmarks) {
    console.log('Bookmarks:', bookmarks);
    
    if (!bookmarks || bookmarks.length === 0) {
      console.log('No bookmarks found in this folder');
      return;
    }
    
    const urls = bookmarks
      .filter(b => b.url)
      .map(b => b.url);
    
    console.log('URLs:', urls);
    
    // 获取文件夹名
    chrome.bookmarks.get(selectedFolderId, function(folder) {
      const folderName = folder[0]?.title || '';
      
      // 提取公共字段
      const commonPattern = findCommonUrlPattern(urls);
      console.log('Common pattern:', commonPattern);
      
      // 设置默认值：优先使用公共字段，否则使用文件夹名
      const defaultValue = commonPattern || folderName;
      document.getElementById('findPatternInput').value = defaultValue;
    });
  });
});

  // 查找URL公共字段
  function findCommonUrlPattern(urls) {
    if (urls.length === 0) return '';
    
    // 解析URL并提取核心域名部分
    const domainParts = urls.map(url => {
      try {
        const u = new URL(url);
        // 去除www前缀
        let host = u.hostname.replace(/^www\./i, '');
        // 提取主域名部分（去掉顶级域名）
        const parts = host.split('.');
        if (parts.length > 1) {
          return parts[parts.length - 2];
        }
        return host;
      } catch {
        return '';
      }
    }).filter(p => p.length > 0);

    if (domainParts.length === 0) return '';

    // 统计每个部分出现的频率
    const partCounts = {};
    domainParts.forEach(part => {
      partCounts[part] = (partCounts[part] || 0) + 1;
    });

    // 找到出现频率最高的部分
    let mostCommon = '';
    let maxCount = 0;
    for (const [part, count] of Object.entries(partCounts)) {
      if (count > maxCount) {
        mostCommon = part;
        maxCount = count;
      }
    }

    // 如果超过一半URL共享相同的主域名，则返回
    if (maxCount >= Math.ceil(domainParts.length / 2)) {
      return mostCommon;
    }

    // 否则返回空字符串
    return '';
  }

// 替换按钮点击事件
document.getElementById('replaceBtn').addEventListener('click', () => {
  const folderId = document.getElementById('folderSelect').value;
  const findPattern = document.getElementById('findPatternInput').value;
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
