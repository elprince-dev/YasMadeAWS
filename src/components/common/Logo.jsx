import { useTheme } from '../../contexts/ThemeContext'

function Logo({ className = 'h-32 w-auto' }) {
  const { theme } = useTheme()
  
  return (
    <img
      src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
      alt="YasMade Logo"
      className={className}
    />
  )
}

export default Logo