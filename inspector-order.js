const inspectorFields = document.querySelector('#fields');
const inspectorSections = inspectorFields.querySelectorAll('section');
const creativeSection = [...inspectorSections].find(section => section.querySelector('h3')?.textContent === 'Креативы');
const applicationSection = [...inspectorSections].find(section => section.querySelector('h3')?.textContent === 'Применение');

if (creativeSection) inspectorFields.querySelector('.picked').after(creativeSection);
if (applicationSection) applicationSection.remove();
