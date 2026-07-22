export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="h-8 w-48 bg-gray-200 rounded-md mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-64 bg-gray-200 rounded-xl w-full" />
    </div>
  );
}
