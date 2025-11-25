export default function RecipeDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Recipe Detail</h1>
      <p className="text-gray-600 mt-2">Recipe ID: {params.id}</p>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  )
}