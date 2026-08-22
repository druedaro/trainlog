import re

with open('src/features/discover/DiscoverPage.tsx', 'r') as f:
    content = f.read()

# Replace setArticles, setUpdatedAt
content = re.sub(
    r'setArticles\(sortArticles\(discoverDoc\.articles\)\);\s*setUpdatedAt\(discoverDoc\.updatedAt\);',
    r'queryClient.invalidateQueries({ queryKey: [\'discover\', user.uid] });',
    content
)

# Replace setExploreArticles, setExploreUpdatedAt
content = re.sub(
    r'setExploreArticles\(sortArticles\(docToSave\.articles\)\);\s*setExploreUpdatedAt\(docToSave\.updatedAt\);',
    r'queryClient.invalidateQueries({ queryKey: [\'explore\', user.uid] });',
    content
)

# Remove loadExploreArticles and its useEffect
content = re.sub(
    r'const loadExploreArticles = useCallback\(async \(\) => \{.*?\},\s*\[.*?\]\);\s*useEffect\(\(\) => \{\s*if \(activeTab === \'explore\' && exploreArticles\.length === 0\) \{\s*loadExploreArticles\(\);\s*\}\s*\},\s*\[.*?\]\);',
    r'',
    content,
    flags=re.DOTALL
)

# Replace optimistic updates for saved articles
content = re.sub(
    r'setSavedArticles\(\(prev\) => prev\.filter\(\(a\) => a\.id !== article\.id\)\);',
    r'queryClient.setQueryData([\'savedArticles\', user.uid], (old: DiscoverArticle[] = []) => old.filter(a => a.id !== article.id));',
    content
)
content = re.sub(
    r'setSavedArticles\(\(prev\) => \[\.\.\.prev, article\]\);',
    r'queryClient.setQueryData([\'savedArticles\', user.uid], (old: DiscoverArticle[] = []) => [...old, article]);',
    content
)

# Replace markArticleAsRead optimistic update
content = re.sub(
    r'setArticles\(prev => prev\.map\(a => a\.id === article\.id \? \{ \.\.\.a, isRead: true \} : a\)\);',
    r'queryClient.setQueryData([\'discover\', user.uid], (old: any) => ({ ...old, articles: old.articles.map((a: any) => a.id === article.id ? { ...a, isRead: true } : a) }));',
    content
)

with open('src/features/discover/DiscoverPage.tsx', 'w') as f:
    f.write(content)
