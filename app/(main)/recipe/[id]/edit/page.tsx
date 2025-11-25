export default function RecipeEditPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Edit Recipe</h1>
      <p className="text-gray-600 mt-2">Recipe ID: {params.id}</p>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  )
}