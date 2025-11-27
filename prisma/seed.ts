import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // await prisma.tournamentEntry.deleteMany();
    await prisma.tournament.deleteMany();

    console.log('Seeding database...');

    await prisma.tournament.create({
        data: {
            title: 'Dota 2 Champions League: Server Edition',
            imageUrl: 'https://cs11.pikabu.ru/post_img/2019/04/29/5/og_og_1556521295259832113.jpg',
            discipline: 'Dota 2',
            prizePool: 50000,
            type: 'Онлайн',
            format: 'Single Elimination',
            formatVersus: '5v5',
            description: 'Турнир, который мы создали через бэкенд!',
            rules: 'Играем честно.',
            startDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // +7 дней от сейчас
            status: 'registrationOpened',
            maxParticipants: 32,
            currentParticipants: 5,
            prizeFirst: '30 000 ₽',
            prizeSecond: '15 000 ₽',
            prizeThird: '5 000 ₽',
        },
    });

    await prisma.tournament.create({
        data: {
            title: 'CS 2 Server Cup',
            imageUrl: 'https://img-s-msn-com.akamaized.net/tenant/amp/entityid/AA1HH29y.img?w=2200&h=1100&m=4&q=79',
            discipline: 'CS 2',
            prizePool: 100000,
            type: 'Офлайн (LAN)',
            address: 'Компьютерный клуб CyberClub',
            format: 'Double Elimination',
            formatVersus: '5v5',
            description: 'Битва на сервере!',
            rules: 'Только хедшоты.',
            startDate: new Date(), // Прямо сейчас
            status: 'live',
            maxParticipants: 16,
            currentParticipants: 16,
            prizeFirst: '60 000 ₽',
            prizeSecond: '30 000 ₽',
            prizeThird: '10 000 ₽',
        },
    });

    console.log('Seeding finished.');
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});