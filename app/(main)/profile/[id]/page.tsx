export default function ProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p className="text-gray-600 mt-2">User ID: {params.id}</p>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  )
}