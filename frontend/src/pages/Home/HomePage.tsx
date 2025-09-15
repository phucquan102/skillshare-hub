import React from "react";
import Header from "../../components/common/Header/Header";
import Footer from "../../components/common/Footer/Footer";

const HomePage: React.FC = () => {
  return (
    <>
      <Header />

      {/* Nội dung chính của trang */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-5xl font-extrabold text-blue-600 underline">
  Welcome to EduPress
</h1>
<p className="bg-yellow-200 text-red-600 p-6 rounded-lg shadow-lg">
  Nếu đoạn này nền vàng, chữ đỏ, có padding, bo góc và đổ bóng → Tailwind đang chạyyyyyy 🎉
</p>

      </main>

      <Footer />
    </>
  );
};

export default HomePage;
