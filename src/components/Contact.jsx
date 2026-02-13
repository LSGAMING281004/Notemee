import React, { useState } from 'react';
import Footer from './Footer';
import { useToast } from '../context/ToastContext';
import '../styles/PolicyPages.css';

const Contact = () => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        showToast('Thank you for reaching out! We will get back to you soon.', 'success');
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="page-container">
            <main className="policy-content">
                <h1>Contact Us</h1>
                <p>Have questions or feedback? We'd love to hear from you. Reach out to us using the form below or via email.</p>

                <div className="contact-details">
                    <p><strong>Email:</strong> lsgaming342@gmail.com</p>
                    <p><strong>Publisher ID:</strong> pub-5497701855213936</p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Message</label>
                        <textarea
                            rows="5"
                            required
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        ></textarea>
                    </div>
                    <button type="submit" className="submit-btn">Send Message</button>
                </form>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
