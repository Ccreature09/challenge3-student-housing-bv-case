export default function Page() {
  return (
    <div>
      <div className="text-center">
        <p className="text-blue-600 text-6xl">Student Housing BV</p>
        <strong><p>Welcome to Student Housing BV!</p></strong>
        <p className="text-red-600 font-bold">Urgent Announcements</p>
      </div>

      <nav className="flex flex-col gap-2 mt-4">
        <ul>
          <li>
            <a href="/homepage">Home</a>
          </li>
          <li>
            <a href="/homepage/about">About</a>
          </li>
          <li>
            <a href="/homepage/repairs">Repairs</a>
          </li>
          <li>
            <a href="/homepage/complaints">Complaints</a>
          </li>
          <li>
            <a href="/homepage/maintenance">Maintenance</a>
          </li>
          <li>
            <a href="/homepage/account">Account</a>
          </li>
          <li>
            <a href="/homepage/Logout">Logout</a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
