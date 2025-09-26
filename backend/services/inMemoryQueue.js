const jobs = [];
let isProcessing = false;

export const addJob = async (jobData, handler) => {
  jobs.push({ data: jobData, handler });
  processJobs();
};

// Process jobs one by one
const processJobs = async () => {
  if (isProcessing || jobs.length === 0) return;

  isProcessing = true;
  const job = jobs.shift();

  try {
    await job.handler(job.data);
  } catch (err) {
    console.error("Job processing failed:", err);
  } finally {
    isProcessing = false;
    processJobs();
  }
};
