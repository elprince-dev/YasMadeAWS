// Storage test utility to debug upload issues
export const testStorageConnection = async (supabase) => {
  try {
    console.log('Testing storage connection...')
    
    // Test if we can list buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    console.log('Available buckets:', buckets, bucketsError)
    
    // Test if we can list files in images bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('images')
      .list('products', { limit: 1 })
    console.log('Files in products folder:', files, filesError)
    
    return { buckets, files, bucketsError, filesError }
  } catch (error) {
    console.error('Storage test error:', error)
    return { error }
  }
}

export const testFileUpload = async (supabase) => {
  try {
    // Create a small test file
    const testContent = 'test'
    const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
    
    const { data, error } = await supabase.storage
      .from('images')
      .upload(`products/test-${Date.now()}.txt`, testFile)
    
    console.log('Test upload result:', { data, error })
    return { data, error }
  } catch (error) {
    console.error('Test upload error:', error)
    return { error }
  }
}