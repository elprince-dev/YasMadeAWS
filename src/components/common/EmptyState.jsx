function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />}
      <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
      {action}
    </div>
  )
}

export default EmptyState