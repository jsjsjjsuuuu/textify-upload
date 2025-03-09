
import { Link } from "react-router-dom";

const AppHeader = () => {
  return (
    <>
      <header className="text-center mb-8 animate-slide-up">
        <h1 className="text-4xl font-bold text-brand-brown mb-3">استخراج النص من الصور</h1>
      </header>

      <nav className="mb-8 flex justify-end">
        <ul className="flex gap-6 py-[3px] my-0 mx-[240px] px-[174px]">
          <li>
            <Link to="/" className="text-brand-brown font-medium hover:text-brand-coral transition-colors my-[46px]">
              الرئيسية
            </Link>
          </li>
          <li>
            <Link to="/api" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
              API
            </Link>
          </li>
          <li>
            <Link to="/records" className="text-brand-brown font-medium hover:text-brand-coral transition-colors">
              السجلات
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
};

export default AppHeader;
