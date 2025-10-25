function FormField({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false, 
  placeholder = '', 
  className = '',
  children 
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      {children || (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className="w-full px-4 py-2 rounded-md border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-primary-500 focus:border-primary-500"
        />
      )}
    </div>
  )
}

export default FormField